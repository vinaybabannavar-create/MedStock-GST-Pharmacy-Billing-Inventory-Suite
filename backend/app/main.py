from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db import check_db_connection, SessionLocal
from app.config import settings
from app.routers import auth, medicines, suppliers, batches, customers, purchases, sales, analytics
from app.routers.auth import seed_initial_users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed default users
    db = SessionLocal()
    try:
        seed_initial_users(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="MediLedger API",
    description="Pharmacy Billing & Inventory Management System — Karnataka, India",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow all origins for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/auth",      tags=["Auth"])
app.include_router(medicines.router,  prefix="/medicines",  tags=["Medicines"])
app.include_router(suppliers.router,  prefix="/suppliers",  tags=["Suppliers"])
app.include_router(batches.router,    prefix="/batches",    tags=["Batches"])
app.include_router(customers.router,  prefix="/customers",  tags=["Customers"])
app.include_router(purchases.router,  prefix="/purchases",  tags=["Purchases"])
app.include_router(sales.router,      prefix="/sales",      tags=["Sales"])
app.include_router(analytics.router,  prefix="/analytics",  tags=["Analytics"])

# ─── Core endpoints ──────────────────────────────────────────
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to MediLedger API", "status": "running"}

@app.get("/health", tags=["Root"])
def health_check():
    db_ok = check_db_connection()
    if not db_ok:
        raise HTTPException(status_code=500, detail="Database connection failed")
    return {
        "status": "healthy",
        "database": "connected",
        "store_state_code": settings.STORE_STATE_CODE
    }
