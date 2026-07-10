from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app import auth, models, schemas
from app.db import get_db

router = APIRouter()

require_any = auth.RoleChecker(["admin", "pharmacist", "cashier"])


@router.get("/", response_model=List[schemas.StockLedgerResponse])
def list_stock_ledger(
    batch_id: Optional[int] = Query(None, description="Filter by batch ID"),
    reason: Optional[str] = Query(None, description="Filter by reason (sale, purchase, adjustment, expiry_removal)"),
    start_date: Optional[date] = Query(None, description="Start date of filter range"),
    end_date: Optional[date] = Query(None, description="End date of filter range"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    """
    Retrieve stock ledger entries (audit trail) with filtering and pagination.
    """
    query = db.query(models.StockLedger)
    
    if batch_id is not None:
        query = query.filter(models.StockLedger.batch_id == batch_id)
    if reason is not None:
        query = query.filter(models.StockLedger.reason == reason)
    if start_date is not None:
        query = query.filter(models.StockLedger.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.StockLedger.created_at <= end_date)
        
    return query.order_by(models.StockLedger.created_at.desc(), models.StockLedger.id.desc()).offset(skip).limit(limit).all()
