<div align="center">

# 💊 MediLedger

### GST-Compliant Pharmacy Billing & Inventory Suite

*Built for a family-run medical store in Karnataka, India*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Private-lightgrey?style=flat)]()

</div>

---

MediLedger replaces manual pharmacy billing registers with a real, auditable system: GST-correct invoicing, batch-and-expiry-aware stock, and a permanent ledger of every unit that enters or leaves the shop. It's built for one store, running its actual day-to-day billing — not a demo.

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Feature Overview](#feature-overview)
- [What's Changed & Improved](#whats-changed--improved)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [GST Logic](#gst-logic)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [License](#license)

---

## Why This Exists

Most small Indian pharmacies bill on paper or on tools that treat GST, batch expiry, and stock as an afterthought. MediLedger is built the other way round: **every rupee and every unit is traceable.** No stock quantity changes without a reason and a timestamp in `stock_ledger`. No sale goes out without the correct CGST/SGST or IGST split for the customer's state. No batch gets billed past its expiry date, enforced at the API — not just hidden in the UI.

## Feature Overview

**Billing**
- Cart-based point-of-sale billing with live GST calculation
- Automatic CGST + SGST for in-state (Karnataka) customers, IGST for out-of-state
- Server-side rejection of expired or out-of-stock batches — never trusts the frontend alone
- Auto-generated sequential invoice numbers
- On-the-fly, itemized PDF invoice generation (ReportLab)
- **Inline quick-add**: add a new customer or medicine directly from the billing counter without leaving the page — newly created records are auto-selected
- Cart automatically clears when the selected customer is changed, preventing a stale cart from being billed to the wrong person

**Inventory**
- Full medicine, supplier, customer, and batch management
- Batch-level expiry and MRP tracking, with a dedicated FEFO-sorted "available stock" view
- A dedicated stock-adjustment endpoint (damage, correction, expiry write-off) that **always** logs to the audit ledger — direct quantity edits are blocked at the API level
- Database-enforced uniqueness on `(medicine, batch number, supplier)` so duplicate batches can't be created
- **Per-row delete** on every medicine and every batch, with a confirmation prompt
- **Delete All** on both tables, clearing rows in FK-safe order
- **Inline quick-add medicine and supplier** directly inside the Record Batch form — newly created items are auto-selected in the dropdown

**Purchasing**
- Supplier purchase entry that creates batches and stock automatically
- Per-line **free quantity** and **discount %** support, matching how Indian pharma distributors actually bill (e.g. "10 + 1 free")

**Audit & Reporting**
- Immutable `stock_ledger` — every sale, purchase, and adjustment is logged with a reason and reference, and is fully queryable via the API
- Expiry alerts (expired / critical ≤7 days / upcoming 8–30 days) and low-stock alerts
- Sales summaries for today, this month, and all-time
- Revenue is floored at zero — a discount can never push a sale's stored total negative

**Access & Operations**
- **Open registration login** — log in with an Email ID and Full Name; the first login for a given email registers that account as admin automatically, no separate signup step
- **Restore Software** sidebar action — resets form drafts and UI state to defaults without touching the database
- **Clear History** sidebar action — calls a dedicated backend endpoint that permanently deletes all operational records (sales, purchases, batches, medicines, customers, suppliers, stock ledger) in correct FK order, while keeping user accounts intact
- One-command startup for the full stack (database, API, frontend) via Docker Compose
- Scripted, scheduled PostgreSQL backups with 30-day retention

---

## What's Changed & Improved

A running log of functional changes made on top of the initial build, most recent first.

### 🩹 Stability fixes — blank page crash & supplier validation

- Fixed a frontend crash that produced a blank page under certain state transitions.
- Relaxed supplier `GSTIN` validation from a strict 15-character requirement to a flexible 1–20 characters, and `state_code` from an exact 2 digits to 1–3 characters — the original strict validation was rejecting real-world entries during testing.
- The billing cart now clears automatically when the selected customer changes.

**Files changed:** `backend/app/schemas.py`, `frontend/src/App.jsx`, `frontend/src/pages/Inventory.jsx`, `frontend/src/pages/Suppliers.jsx`

---

### 🔐 Login — open self-registration

**Before:** Three hardcoded accounts (`admin / admin123`, `pharmacist / pharma123`, `cashier / cashier123`) were required; there was no way to add new users from the UI.

**After:**
- The login page accepts an **Email ID** and a **Full Name**.
- First submission for a given email registers that user dynamically with the `admin` role.
- Subsequent logins verify the name against the stored hash and reject a mismatch.
- The three legacy seeded accounts are actively deleted from the database on every backend startup.

**Files changed:** `backend/app/routers/auth.py`, `frontend/src/pages/LoginPage.jsx`

---

### 🗑️ Clear History — real database wipe

**Before:** "Clear History" only reset in-memory frontend state. Refreshing the page brought all the old data straight back, since nothing had actually changed in the database.

**After:**
- The button now calls `POST /analytics/clear-all`, which deletes rows in strict FK dependency order:
  `stock_ledger → sale_items → sales → purchase_items → purchases → batches → medicines → customers → suppliers`
- User accounts are preserved.
- A separate **Restore Software** action resets only UI state (form drafts, cart, active tab) without touching the database.

**Root cause of the original bug:** the calling user wasn't an admin, so the backend correctly returned `403 Forbidden` — but the frontend cleared its local state anyway, making it look like the wipe worked until the next refresh revealed the data was untouched. Fixed as a side effect of making all self-registered users admins.

**Files changed:** `backend/app/routers/analytics.py`, `frontend/src/App.jsx`

---

### 📦 Inventory — per-row delete & Delete All

| Control | Medicines table | Batches table |
|---|---|---|
| Delete individual row | ✅ | ✅ |
| Delete all rows | ✅ | ✅ |
| Confirmation prompt | ✅ | ✅ |

- Deleting a medicine that still has batches linked to sales returns a `400` with a plain-language message instead of silently corrupting data.
- A new `DELETE /batches/{id}` endpoint was added (admin only), with the same FK-safe guard.
- "Delete All Medicines" deletes dependent batches first, then the medicines themselves.

**Files changed:** `backend/app/routers/batches.py`, `backend/app/routers/medicines.py`, `frontend/src/pages/Inventory.jsx`, `frontend/src/App.jsx`

---

### ⚡ Inline quick-add — billing counter & batch recorder

**Before:** Adding a medicine or customer mid-billing meant leaving the Billing page, creating the record on another page, then coming back and re-searching for it.

**After:**
- **Billing page:** a "+ Add New Customer" toggle and a "+ Add New Medicine" toggle each reveal a compact inline form. On save, the new record is auto-selected immediately, no page change.
- **Record Batch form (Inventory page):** the same pattern for adding a medicine or supplier inline while recording a batch — auto-selected on save, cancels cleanly if dismissed.

**Files changed:** `frontend/src/pages/Billing.jsx`, `frontend/src/pages/Inventory.jsx`, `frontend/src/App.jsx`

---

### 🐛 Bug fix — negative revenue on the dashboard

**Before:** A discount larger than the pre-tax subtotal could push `grand_total` negative, distorting the all-time revenue counter.

**After:** `grand_total = max(0, subtotal + cgst + sgst + igst − discount)` — floored at zero regardless of the discount entered.

**Files changed:** `backend/app/routers/sales.py`

---

## Architecture

```mermaid
flowchart LR
    subgraph Client
        UI[React 19 + Vite\nTailwind CSS v4]
    end

    subgraph Server["Docker Compose"]
        API[FastAPI Backend\nSQLAlchemy + Alembic]
        DB[(PostgreSQL 16)]
    end

    UI -- "REST / JWT" --> API
    API -- "SQL" --> DB
    API -- "ReportLab" --> PDF[/Invoice PDF/]
    DB -. "pg_dump, daily" .-> Backup[/backup.sh → .sql archive/]
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI (Python) |
| ORM & migrations | SQLAlchemy + Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (OAuth2 password flow), bcrypt hashing, open self-registration |
| PDF generation | ReportLab |
| Frontend | React 19 (Vite), Tailwind CSS v4, lucide-react icons |
| HTTP client | Axios |
| Containerization | Docker Compose (db, backend, frontend services) |

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ SALES : creates
    USERS ||--o{ PURCHASES : creates
    SUPPLIERS ||--o{ BATCHES : supplies
    SUPPLIERS ||--o{ PURCHASES : fulfills
    MEDICINES ||--o{ BATCHES : "stocked as"
    BATCHES ||--o{ PURCHASE_ITEMS : "received via"
    BATCHES ||--o{ SALE_ITEMS : "sold from"
    BATCHES ||--o{ STOCK_LEDGER : "tracked in"
    CUSTOMERS ||--o{ SALES : "billed to"
    PURCHASES ||--o{ PURCHASE_ITEMS : contains
    SALES ||--o{ SALE_ITEMS : contains

    USERS {
        int id PK
        string username
        string name
        string role
    }
    MEDICINES {
        int id PK
        string name
        string generic_name
        string manufacturer
        string hsn_code
        numeric gst_rate
        string unit
        string category
    }
    BATCHES {
        int id PK
        string batch_no
        date expiry_date
        int quantity
        numeric purchase_price
        numeric mrp
    }
    SUPPLIERS {
        int id PK
        string name
        string gstin
        string phone
        string address
        string state_code
    }
    CUSTOMERS {
        int id PK
        string name
        string phone
        string address
        string state_code
    }
    PURCHASES {
        int id PK
        string invoice_no
        date date
    }
    PURCHASE_ITEMS {
        int id PK
        int quantity
        int free_quantity
        numeric discount_percent
    }
    SALES {
        int id PK
        string invoice_no
        numeric subtotal
        numeric cgst_amount
        numeric sgst_amount
        numeric igst_amount
        numeric discount
        numeric total
    }
    SALE_ITEMS {
        int id PK
        int quantity
        numeric gst_rate
        numeric line_total
    }
    STOCK_LEDGER {
        int id PK
        int change_qty
        string reason
        datetime created_at
    }
```

`stock_ledger.reason` is one of `sale`, `purchase`, `adjustment`, or `expiry_removal` — every row is written by the server, never editable by a client.

## API Reference

All endpoints are prefixed as shown and require a `Bearer` JWT except `/auth/login`.

<details>
<summary><strong>Auth</strong> — <code>/auth</code></summary>

| Method | Path | Description |
|---|---|---|
| POST | `/login` | Email ID + Full Name login. Auto-registers as admin on first use for that email, otherwise verifies the name matches the stored hash. Returns JWT |
| GET | `/me` | Current authenticated user |

**Note:** All self-registered users receive the `admin` role. There are no hardcoded default accounts — any pre-existing `admin` / `pharmacist` / `cashier` rows are deleted on every backend startup.

</details>

<details>
<summary><strong>Medicines</strong> — <code>/medicines</code></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/` | List medicines |
| GET | `/{id}` | Get one medicine |
| POST | `/` | Create medicine |
| PUT | `/{id}` | Update medicine |
| DELETE | `/{id}` | Delete medicine (admin only) — `400` if linked batches exist |

</details>

<details>
<summary><strong>Suppliers</strong> / <strong>Customers</strong></summary>

Both expose the same full CRUD set: `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`, under `/suppliers` and `/customers` respectively.

</details>

<details>
<summary><strong>Batches</strong> — <code>/batches</code></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all batches |
| GET | `/available` | In-stock, non-expired batches, sorted by expiry (FEFO reference) |
| GET | `/{id}` | Get one batch |
| POST | `/` | Create batch directly |
| PUT | `/{id}` | Update batch **metadata only** (batch_no, expiry, MRP) — quantity is locked here |
| POST | `/{id}/adjust` | The only way to change quantity outside a sale/purchase — always writes a `stock_ledger` row |
| DELETE | `/{id}` | Delete a batch (admin only) — `400` if referenced by sales or purchases |

</details>

<details>
<summary><strong>Purchases</strong> — <code>/purchases</code></summary>

| Method | Path | Description |
|---|---|---|
| POST | `/` | Record a supplier purchase — creates/updates batches, applies free quantity + discount, writes ledger entries |
| GET | `/` | List purchase history, filterable by supplier and date range |
| GET | `/{id}` | Purchase detail with line items |

</details>

<details>
<summary><strong>Sales</strong> — <code>/sales</code></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/` | List sales |
| GET | `/{id}` | Sale detail |
| POST | `/` | Create a sale — GST split, stock deduction, invoice numbering, ledger write, all in one transaction. Total floored at zero |
| GET | `/{id}/pdf` | Generate and download the GST invoice PDF |

</details>

<details>
<summary><strong>Stock Ledger</strong> — <code>/stock-ledger</code></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/` | Query the full audit trail, filterable by batch, reason, and date range |

</details>

<details>
<summary><strong>Analytics</strong> — <code>/analytics</code></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/alerts` | Expired, critical (≤7d), upcoming (8–30d) expiry buckets, plus low-stock items |
| GET | `/sales-summary` | Revenue and invoice counts — today, this month, all-time |
| POST | `/clear-all` | **Admin only.** Permanently deletes all operational data in FK-safe order (`stock_ledger → sale_items → sales → purchase_items → purchases → batches → medicines → customers → suppliers`). User accounts are preserved. Backs the "Clear History" sidebar action |

</details>

Interactive Swagger docs are available at `/docs` once the backend is running.

## GST Logic

The store's registered state is Karnataka (`STORE_STATE_CODE = "29"`), set once in backend config.

- **Customer's state = Karnataka, or no customer specified (walk-in)** → GST splits evenly into **CGST + SGST**
- **Customer's state ≠ Karnataka** → full rate applied as **IGST**

This is computed per line item at sale time and stored as separate `cgst_amount`, `sgst_amount`, and `igst_amount` fields on the sale — never as a single combined tax figure — so reporting can break each out correctly for GST filing.

The sale's stored total is `max(0, subtotal + taxes − discount)` — a discount that exceeds the pre-tax total never produces a negative stored value.

## Project Structure

```
MedStock-GST-Pharmacy-Billing-Inventory-Suite/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── scripts/
│   │   └── backup.sh              # Scheduled pg_dump, 30-day retention
│   ├── alembic/versions/          # 3 migrations: initial schema,
│   │                                 unique batch constraint, free_quantity
│   │                                 + discount_percent fields
│   └── app/
│       ├── main.py                # App entrypoint, CORS, router registration
│       ├── config.py              # Settings incl. STORE_STATE_CODE
│       ├── db.py                  # SQLAlchemy session setup
│       ├── auth.py                # JWT + bcrypt helpers
│       ├── models.py              # All 10 ORM tables
│       ├── schemas.py             # Pydantic schemas
│       └── routers/
│           ├── auth.py            # Open self-registration login (Email + Name)
│           ├── medicines.py       # Full CRUD + DELETE with FK guard
│           ├── suppliers.py
│           ├── customers.py
│           ├── batches.py         # + adjust + DELETE endpoints
│           ├── purchases.py
│           ├── sales.py           # total floored at 0
│           ├── stock_ledger.py
│           └── analytics.py       # + POST /clear-all endpoint
└── frontend/
    ├── package.json
    ├── vite.config.js             # Tailwind CSS v4 via @tailwindcss/vite
    └── src/
        ├── main.jsx
        ├── App.jsx                # Shell, sidebar Restore/Clear actions,
        │                            delete handlers, quick-add handlers
        ├── api.js                 # Shared Axios instance + auth headers
        └── pages/
            ├── LoginPage.jsx      # Email ID + Full Name login form
            ├── Dashboard.jsx
            ├── Billing.jsx        # Inline quick-add customer & medicine
            ├── Inventory.jsx      # Per-row delete, Delete All, inline
            │                        quick-add medicine & supplier
            ├── Customers.jsx
            └── Suppliers.jsx
```

## Getting Started

### Prerequisites
- Docker Desktop (with virtualization enabled in BIOS/UEFI), **or** a native PostgreSQL 16 install if running outside Docker

### Run the full stack (Docker)
```bash
git clone https://github.com/vinaybabannavar-create/MedStock-GST-Pharmacy-Billing-Inventory-Suite.git
cd MedStock-GST-Pharmacy-Billing-Inventory-Suite
cp backend/.env.example backend/.env
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

### First Login

There are no pre-seeded accounts.

1. Enter any **Email ID** (e.g. `you@yourstore.com`)
2. Enter your **Full Name**
3. Submit

The backend registers that email as an admin account on first use. Use the same email + name combination on every subsequent login — a mismatched name for an existing email is rejected.

### Sidebar Operations

| Button | Action |
|---|---|
| **Restore Software** | Resets form drafts, cart, and UI state to defaults. Does not touch the database |
| **Clear History** | Calls `POST /analytics/clear-all` — permanently deletes all medicines, batches, sales, purchases, customers, suppliers, and stock ledger entries. User accounts are not deleted |

### Backups
```bash
bash backend/scripts/backup.sh
```
Writes a timestamped `.sql` dump and prunes anything older than 30 days. See the script for cron scheduling.

## Environment Variables

Set in `backend/.env` (see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret — change before real deployment |
| `ALGORITHM` | JWT signing algorithm (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT session length |
| `STORE_STATE_CODE` | Store's registered GST state code (`29` = Karnataka) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins for CORS |

Set in `frontend/.env`:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |

## Roadmap

- [ ] GSTR-1-style tax summary report (currently only sales-summary and alerts exist)
- [ ] Server-enforced FEFO on sale (currently advisory via `/batches/available`)
- [ ] Automated test suite covering GST calculation, FK constraint handling, and clear-all ordering
- [ ] Multi-user concurrent billing stress testing on invoice numbering
- [ ] Role selection at registration (currently all self-registered users are admin)
- [ ] Purchase history and stock ledger viewer in the frontend UI

## License

Private project — built for internal use at a family-run medical store in Karnataka, India. Not licensed for redistribution.
