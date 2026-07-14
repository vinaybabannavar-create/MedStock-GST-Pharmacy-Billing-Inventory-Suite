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
    email_id = form_data.username.strip()
    name = form_data.password.strip()

    if not email_id or not name:
        raise HTTPException(
            status_code=400,
            detail="Email ID and Name are required"
        )

    # Find existing user by email
    user = db.query(models.User).filter(models.User.username == email_id).first()
    if not user:
        # Register new user dynamically as admin
        hashed_pwd = auth.get_password_hash(name)
        user = models.User(
            name=name,
            username=email_id,
            password_hash=hashed_pwd,
            role="admin"
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error during registration: {str(e)}")
    else:
        # User exists, verify name (password) matches
        if not auth.verify_password(name, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect name for this Email ID",
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
    Cleans up pre-seeded default accounts.
    """
    for username in ["admin", "pharmacist", "cashier"]:
        existing = db.query(models.User).filter(models.User.username == username).first()
        if existing:
            db.delete(existing)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error cleaning default users: {e}")
