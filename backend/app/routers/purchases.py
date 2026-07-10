from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import auth, models, schemas
from app.db import get_db

router = APIRouter()

require_admin_or_pharmacist = auth.RoleChecker(["admin", "pharmacist"])

@router.post("/", response_model=schemas.PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    purchase_data: schemas.PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_pharmacist)
):
    # Verify supplier exists
    supplier = db.query(models.Supplier).filter(models.Supplier.id == purchase_data.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {purchase_data.supplier_id} not found"
        )

    # Start a transaction to ensure rollback on any partial failures
    try:
        # Create purchase record
        db_purchase = models.Purchase(
            supplier_id=purchase_data.supplier_id,
            invoice_no=purchase_data.invoice_no,
            date=purchase_data.date,
            total_amount=Decimal("0.00"),
            created_by=current_user.id
        )
        db.add(db_purchase)
        db.flush()  # Obtain purchase ID

        total_amount = Decimal("0.00")

        # Iterate items
        for item in purchase_data.items:
            target_batch = None

            if item.batch_id is not None:
                # Restocking an existing batch
                batch = db.query(models.Batch).filter(models.Batch.id == item.batch_id).first()
                if not batch:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Batch with ID {item.batch_id} not found"
                    )
                # Verify batch belongs to same medicine
                if item.medicine_id is not None and batch.medicine_id != item.medicine_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Batch ID {item.batch_id} does not match medicine ID {item.medicine_id}"
                    )
                
                # Update batch fields
                received_qty = item.quantity + item.free_quantity
                batch.quantity += received_qty
                batch.purchase_price = item.purchase_price
                if item.mrp is not None:
                    batch.mrp = item.mrp
                target_batch = batch

            else:
                # Creating a new batch on-the-fly or checking duplicates
                if item.medicine_id is None or item.batch_no is None or item.expiry_date is None or item.mrp is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="New batches require medicine_id, batch_no, expiry_date, and mrp"
                    )

                # Check if medicine exists
                medicine = db.query(models.Medicine).filter(models.Medicine.id == item.medicine_id).first()
                if not medicine:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Medicine with ID {item.medicine_id} not found"
                    )

                # Check for existing batch with same medicine, batch number, and supplier
                existing_batch = db.query(models.Batch).filter(
                    models.Batch.medicine_id == item.medicine_id,
                    models.Batch.batch_no == item.batch_no,
                    models.Batch.supplier_id == purchase_data.supplier_id
                ).first()

                received_qty = item.quantity + item.free_quantity
                if existing_batch:
                    # Update existing batch
                    existing_batch.quantity += received_qty
                    existing_batch.purchase_price = item.purchase_price
                    existing_batch.mrp = item.mrp
                    target_batch = existing_batch
                else:
                    # Create new batch record
                    new_batch = models.Batch(
                        medicine_id=item.medicine_id,
                        batch_no=item.batch_no,
                        expiry_date=item.expiry_date,
                        quantity=received_qty,
                        purchase_price=item.purchase_price,
                        mrp=item.mrp,
                        supplier_id=purchase_data.supplier_id
                    )
                    db.add(new_batch)
                    db.flush()  # Obtain batch ID
                    target_batch = new_batch

            # Create purchase item entry
            db_item = models.PurchaseItem(
                purchase_id=db_purchase.id,
                batch_id=target_batch.id,
                quantity=item.quantity,
                free_quantity=item.free_quantity,
                purchase_price=item.purchase_price,
                discount_percent=item.discount_percent
            )
            db.add(db_item)

            # Insert stock ledger row for audit trail
            db_ledger = models.StockLedger(
                batch_id=target_batch.id,
                change_qty=received_qty,
                reason="purchase",
                reference_id=db_purchase.id
            )
            db.add(db_ledger)

            # Sum total applying discount_percent (line_total = qty * price * (1 - disc/100))
            line_total = Decimal(str(item.quantity)) * item.purchase_price * (Decimal("1.00") - item.discount_percent / Decimal("100.00"))
            total_amount += line_total

        # Update total amount on the purchase record
        db_purchase.total_amount = total_amount
        db.commit()
        db.refresh(db_purchase)
        return db_purchase

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record purchase transaction: {str(e)}"
        )


@router.get("/", response_model=List[schemas.PurchaseResponse])
def list_purchases(
    supplier_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["admin", "pharmacist", "cashier"]))
):
    """List purchase transactions with filtering and pagination"""
    query = db.query(models.Purchase)
    if supplier_id is not None:
        query = query.filter(models.Purchase.supplier_id == supplier_id)
    if start_date is not None:
        query = query.filter(models.Purchase.date >= start_date)
    if end_date is not None:
        query = query.filter(models.Purchase.date <= end_date)
    
    return query.order_by(models.Purchase.date.desc(), models.Purchase.id.desc()).offset(skip).limit(limit).all()


@router.get("/{purchase_id}", response_model=schemas.PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["admin", "pharmacist", "cashier"]))
):
    """Retrieve a single purchase by ID"""
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase
