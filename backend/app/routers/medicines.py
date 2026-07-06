from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.db import get_db

router = APIRouter()

require_admin_or_pharmacist = auth.RoleChecker(["admin", "pharmacist"])
require_any = auth.RoleChecker(["admin", "pharmacist", "cashier"])

@router.get("/", response_model=List[schemas.MedicineResponse])
def list_medicines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    return db.query(models.Medicine).offset(skip).limit(limit).all()

@router.get("/{medicine_id}", response_model=schemas.MedicineResponse)
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine

@router.post("/", response_model=schemas.MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    medicine: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_pharmacist)
):
    db_medicine = models.Medicine(**medicine.model_dump())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@router.put("/{medicine_id}", response_model=schemas.MedicineResponse)
def update_medicine(
    medicine_id: int,
    medicine: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_pharmacist)
):
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    for key, value in medicine.model_dump().items():
        setattr(db_medicine, key, value)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["admin"]))
):
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(db_medicine)
    db.commit()
