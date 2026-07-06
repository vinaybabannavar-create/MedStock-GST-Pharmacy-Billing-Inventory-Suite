from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, ForeignKeyConstraint, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, pharmacist, cashier
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    purchases = relationship("Purchase", back_populates="creator")
    sales = relationship("Sale", back_populates="creator")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    gstin = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    state_code = Column(String, nullable=False)  # e.g., "29" for Karnataka

    # Relationships
    batches = relationship("Batch", back_populates="supplier")
    purchases = relationship("Purchase", back_populates="supplier")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    generic_name = Column(String, nullable=True)
    manufacturer = Column(String, nullable=False)
    hsn_code = Column(String, nullable=False)
    gst_rate = Column(Numeric(5, 2), nullable=False)  # e.g., 18.00 for 18%
    unit = Column(String, nullable=False)  # Strip, Bottle, Box, etc.
    category = Column(String, nullable=False)  # Tablet, Syrup, Injection, etc.

    # Relationships
    batches = relationship("Batch", back_populates="medicine", cascade="all, delete-orphan")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False)
    batch_no = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)  # Current stock qty in units
    purchase_price = Column(Numeric(10, 2), nullable=False)
    mrp = Column(Numeric(10, 2), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    medicine = relationship("Medicine", back_populates="batches")
    supplier = relationship("Supplier", back_populates="batches")
    purchase_items = relationship("PurchaseItem", back_populates="batch")
    sale_items = relationship("SaleItem", back_populates="batch")
    ledger_entries = relationship("StockLedger", back_populates="batch", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=True)
    state_code = Column(String, nullable=True)  # Nullable for local walk-in default

    # Relationships
    sales = relationship("Sale", back_populates="customer")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    invoice_no = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="purchases")
    creator = relationship("User", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    purchase = relationship("Purchase", back_populates="items")
    batch = relationship("Batch", back_populates="purchase_items")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=True)
    date = Column(Date, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    cgst_amount = Column(Numeric(12, 2), nullable=False)
    sgst_amount = Column(Numeric(12, 2), nullable=False)
    igst_amount = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    payment_mode = Column(String, nullable=False)  # Cash, Card, UPI, etc.
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="sales")
    creator = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), nullable=False)  # Percentage rate saved for historical audit
    line_total = Column(Numeric(12, 2), nullable=False)

    # Relationships
    sale = relationship("Sale", back_populates="items")
    batch = relationship("Batch", back_populates="sale_items")


class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    change_qty = Column(Integer, nullable=False)  # Positive for addition, negative for deduction
    reason = Column(String, nullable=False)  # sale, purchase, adjustment, expiry_removal
    reference_id = Column(Integer, nullable=True)  # ID of sale, purchase or adjustment reference
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    batch = relationship("Batch", back_populates="ledger_entries")
