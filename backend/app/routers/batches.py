from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app import models, schemas, auth
from app.db import get_db

router = APIRouter()

require_admin_or_pharmacist = auth.RoleChecker(["admin", "pharmacist"])
require_any = auth.RoleChecker(["admin", "pharmacist", "cashier"])

@router.get("/", response_model=List[schemas.BatchResponse])
def list_batches(
    medicine_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    query = db.query(models.Batch)
    if medicine_id:
        query = query.filter(models.Batch.medicine_id == medicine_id)
    return query.offset(skip).limit(limit).all()

@router.get("/available", response_model=List[schemas.BatchResponse])
def list_available_batches(
    medicine_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    """Returns only batches with quantity > 0 and not expired (for billing use)"""
    today = date.today()
    query = db.query(models.Batch).filter(
        models.Batch.quantity > 0,
        models.Batch.expiry_date >= today
    )
    if medicine_id:
        query = query.filter(models.Batch.medicine_id == medicine_id)
    # Order by expiry date for FEFO reference
    return query.order_by(models.Batch.expiry_date.asc()).all()

@router.get("/{batch_id}", response_model=schemas.BatchResponse)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@router.post("/", response_model=schemas.BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    batch: schemas.BatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_pharmacist)
):
    # Validate medicine and supplier exist
    medicine = db.query(models.Medicine).filter(models.Medicine.id == batch.medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    supplier = db.query(models.Supplier).filter(models.Supplier.id == batch.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    try:
        db_batch = models.Batch(**batch.model_dump())
        db.add(db_batch)
        db.commit()
        db.refresh(db_batch)
        return db_batch
    except Exception as e:
        db.rollback()
        if "unique constraint" in str(e).lower() or "uq_batches" in str(e).lower() or "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail=f"Batch number '{batch.batch_no}' already exists for this medicine and supplier"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create batch: {str(e)}"
        )

@router.put("/{batch_id}", response_model=schemas.BatchResponse)
def update_batch(
    batch_id: int,
    batch_data: schemas.BatchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_pharmacist)
):
    """Update batch metadata only. To change stock quantity, use POST /batches/{batch_id}/adjust."""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    for key, value in batch_data.model_dump().items():
        setattr(db_batch, key, value)
    db.commit()
    db.refresh(db_batch)
    return db_batch


@router.post("/{batch_id}/adjust", response_model=schemas.BatchResponse)
def adjust_batch_quantity(
    batch_id: int,
    adjustment: schemas.BatchAdjust,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_pharmacist)
):
    """
    Apply a signed quantity change to a batch (positive = add stock, negative = remove).
    Always writes a stock_ledger audit entry.
    Reasons accepted: 'adjustment' or 'expiry_removal'.
    """
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    new_quantity = db_batch.quantity + adjustment.change_qty
    if new_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Adjustment would result in negative quantity "
                   f"({db_batch.quantity} + {adjustment.change_qty} = {new_quantity}). "
                   f"Current stock: {db_batch.quantity}"
        )

    db_batch.quantity = new_quantity

    # Record in audit ledger
    ledger_entry = models.StockLedger(
        batch_id=batch_id,
        change_qty=adjustment.change_qty,
        reason=adjustment.reason,
        reference_id=None  # Manual adjustment — no linked sale or purchase
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(db_batch)
    return db_batch


@router.delete("/{batch_id}", status_code=204)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["admin"]))
):
    """Delete a batch record. Admin only. Fails if the batch is referenced by sale_items."""
    db_batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    try:
        db.delete(db_batch)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete batch: it may be referenced by existing sales or purchase records. ({str(e)[:120]})"
        )
