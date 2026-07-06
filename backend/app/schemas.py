from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

# ==========================================
# AUTH & USER SCHEMAS
# ==========================================

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    role: str = Field(..., description="Must be one of: admin, pharmacist, cashier")

    @field_validator('role')
    @classmethod
    def validate_role(cls, value: str) -> str:
        allowed = {"admin", "pharmacist", "cashier"}
        if value not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return value

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    role: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)

    @field_validator('role')
    @classmethod
    def validate_role_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            allowed = {"admin", "pharmacist", "cashier"}
            if value not in allowed:
                raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return value

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# ==========================================
# CUSTOMER SCHEMAS
# ==========================================

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=10, max_length=15)
    address: Optional[str] = None
    state_code: Optional[str] = Field(None, description="GST State code (e.g., '29' for Karnataka), optional for walk-ins")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SUPPLIER SCHEMAS
# ==========================================

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1)
    gstin: str = Field(..., min_length=15, max_length=15, description="15-character GSTIN")
    phone: str = Field(..., min_length=10, max_length=15)
    address: str = Field(..., min_length=1)
    state_code: str = Field(..., min_length=2, max_length=2, description="2-digit State code")

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# MEDICINE SCHEMAS
# ==========================================

class MedicineBase(BaseModel):
    name: str = Field(..., min_length=1)
    generic_name: Optional[str] = None
    manufacturer: str = Field(..., min_length=1)
    hsn_code: str = Field(..., min_length=1)
    gst_rate: Decimal = Field(..., ge=0, le=100, description="GST rate percentage (e.g., 18.00)")
    unit: str = Field(..., description="e.g. Strip, Bottle, Box")
    category: str = Field(..., description="e.g. Tablet, Syrup, Injection")

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# BATCH SCHEMAS
# ==========================================

class BatchBase(BaseModel):
    medicine_id: int
    batch_no: str = Field(..., min_length=1)
    expiry_date: date
    quantity: int = Field(..., ge=0)
    purchase_price: Decimal = Field(..., gt=0)
    mrp: Decimal = Field(..., gt=0)
    supplier_id: int

    @field_validator('expiry_date')
    @classmethod
    def validate_expiry(cls, value: date) -> date:
        return value

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: int
    created_at: datetime
    medicine: Optional[MedicineResponse] = None
    supplier: Optional[SupplierResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PURCHASE SCHEMAS
# ==========================================

class PurchaseItemCreate(BaseModel):
    batch_id: Optional[int] = None
    medicine_id: Optional[int] = None
    batch_no: Optional[str] = None
    expiry_date: Optional[date] = None
    mrp: Optional[Decimal] = None
    quantity: int = Field(..., gt=0)
    purchase_price: Decimal = Field(..., gt=0)

class PurchaseItemResponse(BaseModel):
    id: int
    purchase_id: int
    batch_id: int
    quantity: int
    purchase_price: Decimal

    model_config = ConfigDict(from_attributes=True)

class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_no: str = Field(..., min_length=1)
    date: date
    items: List[PurchaseItemCreate] = Field(..., min_items=1)

class PurchaseResponse(BaseModel):
    id: int
    supplier_id: int
    invoice_no: str
    date: date
    total_amount: Decimal
    created_by: int
    items: List[PurchaseItemResponse]

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SALE SCHEMAS
# ==========================================

class SaleItemCreate(BaseModel):
    batch_id: int
    quantity: int = Field(..., gt=0)
    sale_price: Decimal = Field(..., gt=0)

class SaleItemResponse(BaseModel):
    id: int
    sale_id: int
    batch_id: int
    quantity: int
    sale_price: Decimal
    gst_rate: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = Field(None, description="Temporary name if not a saved customer")
    customer_phone: Optional[str] = Field(None, description="Temporary phone if not a saved customer")
    customer_state_code: Optional[str] = Field(None, description="Optional customer state code")
    payment_mode: str = Field("Cash", description="Cash, Card, UPI, etc.")
    discount: Decimal = Field(Decimal("0.00"), ge=0)
    items: List[SaleItemCreate] = Field(..., min_items=1)

class SaleResponse(BaseModel):
    id: int
    invoice_no: str
    customer_id: Optional[int] = None
    date: date
    subtotal: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    discount: Decimal
    total: Decimal
    payment_mode: str
    created_by: int
    items: List[SaleItemResponse]

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# AUDIT & LEDGER SCHEMAS
# ==========================================

class StockLedgerResponse(BaseModel):
    id: int
    batch_id: int
    change_qty: int
    reason: str
    reference_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
