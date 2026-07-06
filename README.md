# MediLedger — Pharmacy Billing & Inventory Suite

A GST-compliant billing, inventory, and stock-ledger system built for a single medical store in Karnataka, India. MediLedger handles day-to-day pharmacy operations — medicine and batch management, supplier purchases, point-of-sale billing with automatic CGST/SGST/IGST calculation, PDF invoice generation, and real-time stock/expiry alerts — with every stock movement recorded in an immutable audit trail.

This is an active, in-progress build. The sections below describe exactly what is implemented today, not a roadmap.

---

## Tech Stack

| Layer          | Technology                                         |
|----------------|-----------------------------------------------------|
| Backend        | FastAPI (Python), SQLAlchemy ORM, Alembic migrations |
| Database       | PostgreSQL 16                                       |
| Auth           | JWT (OAuth2 password flow), role-based access control |
| PDF Invoices   | ReportLab                                           |
| Frontend       | React 19 (Vite), Tailwind CSS v4, lucide-react icons |
| HTTP Client    | Axios                                               |
| Containerization | Docker Compose (PostgreSQL + FastAPI backend)     |

---

## Features Implemented So Far

### Authentication & Roles
- JWT-based login (`/auth/login`) using OAuth2 password flow
- Three roles: `admin`, `pharmacist`, `cashier`, enforced per-endpoint via a `RoleChecker` dependency
- Default accounts are auto-seeded on first startup (admin, pharmacist, cashier) for immediate local testing

### Master Data Management (Full CRUD)
- **Medicines** — name, generic name, manufacturer, HSN code, GST rate, unit, category
- **Suppliers** — name, GSTIN, phone, address, state code
- **Customers** — name, phone, address, optional state code (used for CGST/SGST vs IGST determination)
- **Batches** — batch number, expiry date, quantity, purchase price, MRP, linked medicine and supplier

### Purchases
- Recording supplier purchases creates purchase records, purchase line items, and corresponding batches in a single transaction

### Billing Engine (`POST /sales`)
The core of the system. On every sale:
- Validates each requested batch has sufficient stock and has not expired — rejected at the API level, not just in the UI
- Computes GST per line item based on the store's registered state (Karnataka, state code `29`, set via `STORE_STATE_CODE` config):
  - Customer in Karnataka (or no customer specified — assumes local walk-in) → **CGST + SGST** (split evenly)
  - Customer outside Karnataka → **IGST** (full rate)
- Deducts stock directly from the selected batch and writes a corresponding entry to `stock_ledger` for full audit traceability (reason: `sale`, linked to the invoice)
- Auto-generates a unique invoice number in the format `MED-YYYY-NNNNNN`
- Applies discounts and computes the grand total
- All operations run inside a single database transaction — a failure partway through rolls back cleanly, so stock and invoice numbers never go out of sync

A `GET /batches/available` endpoint returns only in-stock, non-expired batches sorted by expiry date ascending, for use as a FEFO (first-expiry-first-out) reference list when the frontend selects which batch to bill from.

### PDF Invoices
- `GET /sales/{id}/pdf` generates a branded, GST-compliant invoice PDF on the fly using ReportLab, including itemized medicine/batch/expiry details, CGST/SGST or IGST breakdown, discount, grand total, and terms & conditions

### Alerts & Analytics
- `GET /analytics/alerts` — a single endpoint returning:
  - Batches already expired but still carrying stock
  - Batches expiring within 7 days (critical)
  - Batches expiring within 8–30 days (upcoming)
  - Batches at or below 10 units (low stock)
- `GET /analytics/sales-summary` — invoice count and revenue totals for today, this month, and all-time

### Frontend (React + Tailwind)
A single-page application with view-based navigation (no router yet) covering:
- **Dashboard** — at-a-glance store overview
- **Billing** — cart-based sale entry with live GST calculation and customer state handling
- **Inventory** — medicine and batch management
- **Customers** — customer records
- **Suppliers** — supplier records
- Token-based session persisted in local storage, with authenticated API requests via Axios

### Infrastructure
- `docker-compose.yml` currently orchestrates:
  - `db` — PostgreSQL 16 with a health check gate
  - `backend` — FastAPI app with hot-reload, waiting on the database health check before starting
- Alembic is configured for schema migrations

---

## Database Schema

| Table           | Purpose                                                       |
|-----------------|----------------------------------------------------------------|
| `users`         | Login accounts and roles                                       |
| `suppliers`     | Supplier master data with GSTIN and state code                 |
| `medicines`     | Medicine catalog with HSN code and GST rate                    |
| `batches`       | Stock batches per medicine — quantity, expiry, pricing          |
| `customers`     | Customer master data, optional state code for GST logic         |
| `purchases` / `purchase_items` | Supplier purchase records and their line items          |
| `sales` / `sale_items`         | Billing records with CGST/SGST/IGST breakdown, and their line items |
| `stock_ledger`  | Immutable audit trail of every stock change (sale, purchase, adjustment, expiry write-off) |

---

## Getting Started

### Prerequisites
- Docker Desktop (with virtualization enabled in BIOS/UEFI)
- Node.js (for running the frontend dev server)

### Backend + Database
```bash
git clone https://github.com/vinaybabannavar-create/MedStock-GST-Pharmacy-Billing-Inventory-Suite.git
cd MedStock-GST-Pharmacy-Billing-Inventory-Suite
```
Create a `.env` file inside `backend/` with:
```
DATABASE_URL=postgresql+psycopg://postgres:mediledgerpass@db:5432/mediledger
SECRET_KEY=your-secret-key-here
```
Then start the database and API:
```bash
docker compose up --build
```
The API will be available at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

Default seeded accounts (for local testing only — change before real use):
| Username     | Password    | Role        |
|--------------|-------------|-------------|
| admin        | admin123    | admin       |
| pharmacist   | pharma123   | pharmacist  |
| cashier      | cashier123  | cashier     |

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Known Limitations (Current State)

- FEFO batch selection is currently advisory (`/batches/available` sorts by expiry ascending) rather than enforced automatically by the sale endpoint — the caller specifies the `batch_id` per line item.
- Invoice numbering uses a plain `MED-YYYY-NNNNNN` sequence rather than the Indian financial-year format (`INV/2026-27/00001`).
- `docker-compose.yml` does not yet include the frontend as a containerized service — it currently runs via `npm run dev` outside Docker.
- No automated backup script yet for PostgreSQL.
- No GSTR-style tax summary report yet (only `/analytics/sales-summary` and `/analytics/alerts` exist today).

---

## License

Private project — built for internal use at a family-run medical store in Karnataka, India.
