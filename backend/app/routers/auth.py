from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import auth, models, schemas
from app.db import get_db

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


def seed_initial_users(db: Session):
    """
    Seeds default admin, pharmacist, and cashier accounts if they do not exist.
    """
    default_users = [
        {"name": "System Administrator", "username": "admin", "password": "admin123", "role": "admin"},
        {"name": "Lead Pharmacist", "username": "pharmacist", "password": "pharma123", "role": "pharmacist"},
        {"name": "Cashier Desk 1", "username": "cashier", "password": "cashier123", "role": "cashier"},
    ]

    for user_data in default_users:
        existing = db.query(models.User).filter(models.User.username == user_data["username"]).first()
        if not existing:
            hashed_pwd = auth.get_password_hash(user_data["password"])
            db_user = models.User(
                name=user_data["name"],
                username=user_data["username"],
                password_hash=hashed_pwd,
                role=user_data["role"]
            )
            db.add(db_user)
            print(f"Seeding default user: {user_data['username']} ({user_data['role']})")
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding default users: {e}")
