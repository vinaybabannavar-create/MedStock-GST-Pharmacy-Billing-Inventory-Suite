"""
GET /analytics/alerts — Returns structured alerts for:
  1. Batches expiring within the next 30 days (with count grouped by days-to-expiry bands)
  2. Batches that have already expired but still have stock
  3. Batches with critically low stock (<=10 units)
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import auth, models
from app.db import get_db

router = APIRouter()

require_any = auth.RoleChecker(["admin", "pharmacist", "cashier"])


@router.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    today = date.today()
    warn_horizon = today + timedelta(days=30)
    critical_horizon = today + timedelta(days=7)

    all_batches = db.query(models.Batch).all()

    expiring_soon = []      # 7–30 days to expiry
    expiring_critical = []  # within 7 days (not yet expired)
    already_expired = []    # past expiry, still have stock
    low_stock = []          # quantity <= 10

    for batch in all_batches:
        med = db.query(models.Medicine).filter(models.Medicine.id == batch.medicine_id).first()
        med_name = med.name if med else f"Medicine #{batch.medicine_id}"

        days_remaining = (batch.expiry_date - today).days

        if days_remaining < 0 and batch.quantity > 0:
            already_expired.append({
                "batch_id": batch.id,
                "batch_no": batch.batch_no,
                "medicine_name": med_name,
                "expiry_date": str(batch.expiry_date),
                "quantity": batch.quantity,
                "days_overdue": abs(days_remaining)
            })
        elif 0 <= days_remaining <= 7:
            expiring_critical.append({
                "batch_id": batch.id,
                "batch_no": batch.batch_no,
                "medicine_name": med_name,
                "expiry_date": str(batch.expiry_date),
                "quantity": batch.quantity,
                "days_remaining": days_remaining
            })
        elif 7 < days_remaining <= 30:
            expiring_soon.append({
                "batch_id": batch.id,
                "batch_no": batch.batch_no,
                "medicine_name": med_name,
                "expiry_date": str(batch.expiry_date),
                "quantity": batch.quantity,
                "days_remaining": days_remaining
            })

        if batch.quantity <= 10:
            low_stock.append({
                "batch_id": batch.id,
                "batch_no": batch.batch_no,
                "medicine_name": med_name,
                "expiry_date": str(batch.expiry_date),
                "quantity": batch.quantity
            })

    return {
        "generated_at": str(today),
        "summary": {
            "expired_with_stock": len(already_expired),
            "expiring_critical_7d": len(expiring_critical),
            "expiring_soon_30d": len(expiring_soon),
            "low_stock_batches": len(low_stock)
        },
        "expired_with_stock": already_expired,
        "expiring_critical_7d": expiring_critical,
        "expiring_soon_30d": expiring_soon,
        "low_stock": low_stock
    }


@router.get("/sales-summary")
def get_sales_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    """Returns total sales figures for today, this month, and overall."""
    from sqlalchemy import func
    from decimal import Decimal

    today = date.today()
    first_of_month = today.replace(day=1)

    total_all = db.query(func.sum(models.Sale.total)).scalar() or Decimal("0.00")
    total_month = db.query(func.sum(models.Sale.total)).filter(
        models.Sale.date >= first_of_month
    ).scalar() or Decimal("0.00")
    total_today = db.query(func.sum(models.Sale.total)).filter(
        models.Sale.date == today
    ).scalar() or Decimal("0.00")

    count_all = db.query(func.count(models.Sale.id)).scalar() or 0
    count_month = db.query(func.count(models.Sale.id)).filter(
        models.Sale.date >= first_of_month
    ).scalar() or 0
    count_today = db.query(func.count(models.Sale.id)).filter(
        models.Sale.date == today
    ).scalar() or 0

    return {
        "today": {"invoices": count_today, "revenue": float(total_today)},
        "this_month": {"invoices": count_month, "revenue": float(total_month)},
        "all_time": {"invoices": count_all, "revenue": float(total_all)}
    }
