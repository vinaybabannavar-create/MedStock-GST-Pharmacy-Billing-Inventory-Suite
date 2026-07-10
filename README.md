# MediLedger — Pharmacy Billing & Inventory Suite

A GST-compliant billing, inventory, and stock-ledger system built for a single medical store in Karnataka, India. MediLedger handles day-to-day pharmacy operations — medicine and batch management, supplier purchases, point-of-sale billing with automatic CGST/SGST/IGST calculation, PDF invoice generation, and real-time stock/expiry alerts — with every stock movement recorded in an immutable audit trail.

---

## Tech Stack

| Layer            | Technology                                           |
|------------------|------------------------------------------------------|
| Backend          | FastAPI (Python), SQLAlchemy ORM, Alembic migrations |
| Database         | PostgreSQL 16                                        |
| Auth             | JWT (OAuth2 password flow), role-based access control |
| PDF Invoices     | ReportLab                                            |
| Frontend         | React 19 (Vite), Tailwind CSS v4, lucide-react icons |
| HTTP Client      | Axios                                                |
| Containerization | Docker Compose (PostgreSQL + FastAPI + React/Vite)   |

---

## Features

### Authentication & Roles
- JWT-based login (`/auth/login`) using OAuth2 password flow
- Three roles: `admin`, `pharmacist`, `cashier`, enforced per-endpoint via a `RoleChecker` dependency
- Default accounts are auto-seeded on first startup for immediate local testing

### Master Data Management (Full CRUD)
- **Medicines** — name, generic name, manufacturer, HSN code, GST rate, unit, category
- **Suppliers** — name, GSTIN, phone, address, state code
- **Customers** — name, phone, address, optional state code (used for CGST/SGST vs IGST determination)
- **Batches** — batch number, expiry date, quantity, purchase price, MRP, linked medicine and supplier

### Purchases
- Recording supplier purchases creates purchase records, purchase line items, and corresponding batches in a single transaction
- Supports **free quantity** per line item — free stock is added to physical batch quantity but does not contribute to the cost total
- Supports **line-level discount percent** — applied to the paid quantity total per item
- `GET /purchases` — paginated list filterable by `supplier_id`, `start_date`, `end_date`
- `GET /purchases/{id}` — full purchase detail including all line items

### Billing Engine (`POST /sales`)
- Validates each batch has sufficient stock and has not expired — rejected at the API level
- Computes GST per line item based on the store's registered state (Karnataka, state code `29`):
  - Customer in Karnataka (or walk-in) → **CGST + SGST** (split evenly)
  - Customer outside Karnataka → **IGST** (full rate)
- Deducts stock from the selected batch and writes a `stock_ledger` entry (reason: `sale`)
- Auto-generates unique invoice numbers in the format `MED-YYYY-NNNNNN`
- All operations run in a single database transaction — partial failures roll back cleanly

### PDF Invoices
- `GET /sales/{id}/pdf` — generates a branded, GST-compliant invoice PDF using ReportLab with itemized CGST/SGST or IGST breakdown

### Alerts & Analytics
- `GET /analytics/alerts` — expired batches with stock, near-expiry (7 days / 30 days), and low-stock (≤10 units)
- `GET /analytics/sales-summary` — invoice count and revenue totals for today, this month, and all-time

### Batch & Stock Management
- `PUT /batches/{id}` — updates **metadata only** (batch_no, expiry_date, purchase_price, mrp) — quantity is never overwritten directly
- `POST /batches/{id}/adjust` — adjusts batch stock by a signed integer with a mandatory reason (`adjustment` or `expiry_removal`); always writes to `stock_ledger`; rejects adjustments that would cause negative stock
- DB-level unique constraint on `(medicine_id, batch_no, supplier_id)` prevents duplicate batch entries
- `GET /stock-ledger` — paginated audit trail of all stock changes, filterable by `batch_id`, `reason`, `start_date`, `end_date`

### Frontend (React + Vite)
Modular single-page application split into dedicated page components:
- **LoginPage** — clean login screen with no hardcoded credential hints
- **Dashboard** — at-a-glance alerts and revenue counters
- **Billing** — cart-based sale entry with live GST calculation
- **Inventory** — medicine and batch management
- **Customers** — customer records
- **Suppliers** — supplier records
- API base URL driven by `VITE_API_BASE_URL` environment variable (see `frontend/.env.example`)

---

## Project Structure

```
MedStock-GST-Pharmacy-Billing-Inventory-Suite/
├── docker-compose.yml          # Orchestrates db + backend + frontend
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── .env                    # Local secrets (not committed)
│   ├── .env.example
│   ├── scripts/
│   │   └── backup.sh           # pg_dump backup with 30-day retention
│   ├── alembic/
│   │   └── versions/           # All Alembic migration files
│   └── app/
│       ├── main.py             # FastAPI app, router registration, CORS
│       ├── config.py           # Settings (DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS, etc.)
│       ├── db.py               # SQLAlchemy engine/session setup
│       ├── auth.py             # JWT creation/verification, RoleChecker dependency
│       ├── models.py           # SQLAlchemy ORM models (all 10 tables)
│       ├── schemas.py          # Pydantic request/response schemas
│       └── routers/
│           ├── auth.py         # /auth/login, /auth/me, default user seeding
│           ├── medicines.py    # Medicine CRUD
│           ├── suppliers.py    # Supplier CRUD
│           ├── batches.py      # Batch CRUD + /adjust endpoint + /available (FEFO)
│           ├── customers.py    # Customer CRUD
│           ├── purchases.py    # Purchase recording + GET list/detail
│           ├── sales.py        # Billing engine + PDF invoice generation
│           ├── analytics.py    # /analytics/alerts, /analytics/sales-summary
│           └── stock_ledger.py # GET /stock-ledger (audit trail)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── .env.example            # Documents VITE_API_BASE_URL
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx             # Root component, navigation, shared state
        ├── api.js              # Axios instance with auth header helper
        ├── App.css / index.css
        └── pages/
            ├── LoginPage.jsx
            ├── Dashboard.jsx
            ├── Billing.jsx
            ├── Inventory.jsx
            ├── Suppliers.jsx
            └── Customers.jsx
```

---

## Database Schema

| Table                            | Purpose                                                              |
|----------------------------------|----------------------------------------------------------------------|
| `users`                          | Login accounts and roles                                             |
| `suppliers`                      | Supplier master data with GSTIN and state code                       |
| `medicines`                      | Medicine catalog with HSN code and GST rate                          |
| `batches`                        | Stock batches per medicine — quantity, expiry, pricing               |
| `customers`                      | Customer master data, optional state code for GST logic              |
| `purchases` / `purchase_items`   | Supplier purchase records and their line items (with free_qty & discount) |
| `sales` / `sale_items`           | Billing records with CGST/SGST/IGST breakdown and their line items   |
| `stock_ledger`                   | Immutable audit trail of every stock change (sale, purchase, adjustment, expiry write-off) |

---

## Getting Started

### Prerequisites
- **Docker Desktop** (with virtualization enabled)
- **Node.js 20+** (for running the frontend dev server locally)

### Option A — Full Docker Compose Stack

```bash
git clone https://github.com/vinaybabannavar-create/MedStock-GST-Pharmacy-Billing-Inventory-Suite.git
cd MedStock-GST-Pharmacy-Billing-Inventory-Suite
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg://postgres:mediledgerpass@db:5432/mediledger
SECRET_KEY=your-secret-key-change-this
ALLOWED_ORIGINS=http://localhost:5173
```

Then start everything:
```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |

### Option B — Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
# Set DATABASE_URL in backend/.env pointing to your local Postgres
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
cp .env.example .env        # Edit VITE_API_BASE_URL if needed
npm install
npm run dev
```

### Default Seeded Accounts

> ⚠️ Change these before any real use.

| Username     | Password    | Role        |
|--------------|-------------|-------------|
| admin        | admin123    | admin       |
| pharmacist   | pharma123   | pharmacist  |
| cashier      | cashier123  | cashier     |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Default                    | Description                                      |
|------------------|----------------------------|--------------------------------------------------|
| `DATABASE_URL`   | —                          | PostgreSQL connection string (required)           |
| `SECRET_KEY`     | —                          | JWT signing secret (required)                    |
| `ALLOWED_ORIGINS`| `http://localhost:5173`    | Comma-separated list of allowed CORS origins      |
| `STORE_STATE_CODE`| `29`                      | Karnataka state code for GST logic               |

### Frontend (`frontend/.env`)

| Variable           | Default                  | Description              |
|--------------------|--------------------------|--------------------------|
| `VITE_API_BASE_URL`| `http://localhost:8000`  | Backend API base URL     |

---

## Automated Backups

`backend/scripts/backup.sh` runs `pg_dump` against the running PostgreSQL container, compresses the output with `gzip`, and deletes backups older than 30 days.

### Scheduling Daily Backups via Cron

1. Make the script executable:
   ```bash
   chmod +x backend/scripts/backup.sh
   ```
2. Open your system crontab:
   ```bash
   crontab -e
   ```
3. Add this entry to run daily at 02:00 AM (adjust the path):
   ```cron
   0 2 * * * /path/to/project/backend/scripts/backup.sh >> /var/log/mediledger_backup.log 2>&1
   ```

Backups are saved to `backend/backups/` as `mediledger_backup_YYYYMMDD_HHMMSS.sql.gz`.

---

## License

Private project — built for internal use at a family-run medical store in Karnataka, India.
