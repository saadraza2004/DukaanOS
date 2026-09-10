# 🏪 DukaanOS (دکان او ایس)
### Smart Offline-First Retail POS & Khata Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![.NET](https://img.shields.io/badge/.NET-9.0-purple?logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**DukaanOS** is an offline-first Point of Sale (POS), inventory management, and digital Khata (credit ledger) platform specifically engineered for retail stores, general merchants, and Kiryana shops in Pakistan. 

It bridges modern web technologies with the real-world realities of localized retail: frequent internet fluctuations, billing speed requirements, Roman Urdu searches, and customer credit ledger tracking.

---

## 🌟 Key Features

### 1. ⚡ Offline-First POS Engine (Zero-Downtime Billing)
* Built with **Dexie.js (IndexedDB)** on the client side.
* If internet connectivity drops or the local network flickers, **cashiers can continue scanning, carting, and checking out customers with zero lag**.
* As soon as connectivity restores, the system background-syncs pending transactions with the PostgreSQL database.

### 2. 🇵🇰 Roman Urdu & Bilingual Search
* Products can be searched in **English** (e.g., `Super Basmati Rice`), **Urdu** (e.g., `سپر باسمتی چاول`), or **Roman Urdu** (e.g., `Chawal`, `Cheeni`, `Lal Mirch`, `Sarson Ka Tel`).
* Supports fast Barcode Scanner input and SKU indexing for rapid checkout counters.

### 3. 📒 Digital Khata & Udhaar Ledger
* Complete digital bookkeeping for trusted neighborhood customers who buy on credit.
* Set custom credit limits (`MaxCreditLimit`) per customer.
* Automatic customer balance updates on credit transactions, with full debit/credit ledger history.

### 4. 💰 Roznamcha & Day Closing Reconciliation
* Daily cash drawer closing feature (`/api/dayclosing`).
* Compares expected cash generated from sales against the physical cash counted in the till.
* Records discrepancies, cash withdrawals, and daily closing notes for the store owner.

### 5. 🔒 Role-Based Access Control (RBAC)
* **Owner:** Complete access to analytics, financial reports, profit/loss metrics, inventory adjustments, and user management.
* **Cashier:** Restricted to fast POS checkout, customer lookup, and day closing without access to sensitive store-wide financial margins.

### 6. 📊 Real-Time Analytics Dashboard
* Daily sales turnover, top-selling items, customer debt summaries, and inventory stock-alert indicators.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router), **React 19**, **TypeScript** |
| **Styling & Icons** | **Tailwind CSS v4**, **Lucide React**, **Recharts** (Visualizations) |
| **Local Cache & Storage** | **Dexie.js** (Browser IndexedDB) for offline POS functionality |
| **State & Data Sync** | **TanStack React Query** (React Query v5) |
| **Backend API** | **ASP.NET Core 9.0 Web API (C# / .NET 9)** |
| **ORM & Database** | **Entity Framework Core 9.0**, **Npgsql** provider, **PostgreSQL** |
| **Security & Auth** | **JWT (JSON Web Tokens)**, **BCrypt.Net-Next** password hashing |

---

## 📁 Repository Structure

```text
DukaanOS/
├── START_DUKAAN_OS.bat         # 1-Click launcher (checks DB, starts backend & frontend)
├── STOP_DUKAAN_OS.bat          # 1-Click shutdown script (frees ports 5000 & 3000)
├── DukaanOS.sln                # Visual Studio Solution file
├── README.md                   # Project documentation & reference
├── backend/
│   └── DukaanOS.API/           # ASP.NET Core 9 Web API
│       ├── Controllers/        # REST endpoints (Sales, Products, Customers, etc.)
│       ├── Core/               # Domain Models, Enums (Entities & DB Schema)
│       ├── DTOs/               # Data Transfer Objects & Request/Response Contracts
│       ├── Data/               # DukaanDbContext & DbInitializer (Seed Data)
│       ├── Services/           # Business logic implementations
│       ├── appsettings.json    # DB connection string and JWT configurations
│       └── Program.cs          # Dependency injection, middleware & routing
└── frontend/                   # Next.js 16 Client Application
    ├── src/
    │   ├── app/                # Next.js App Router pages (POS, Dashboard, Khata, etc.)
    │   ├── components/         # Reusable UI components
    │   ├── db/                 # Dexie.js offline schema & sync queue
    │   ├── hooks/              # Custom React hooks (useCart, useOfflineSync)
    │   └── lib/                # API client configuration & utility helpers
    ├── package.json            # Node.js dependencies
    └── tailwind.config.ts      # Tailwind CSS styling configuration
```

---

## 🚀 Quick Start Guide

### Option 1: One-Click Startup (Fastest)
Double-click the launcher script in the root directory:
```bash
START_DUKAAN_OS.bat
```
*It automatically verifies PostgreSQL, starts the .NET backend, boots Next.js, and opens `http://localhost:3000` in your default browser.*

---

### Option 2: Running from VS Code Terminal

#### 1. Start the Backend:
```powershell
cd backend/DukaanOS.API
dotnet run --urls http://localhost:5000
```
*API will run at `http://localhost:5000`*

#### 2. Start the Frontend (in a second terminal):
```powershell
cd frontend
npm run dev
```
*Web App will run at `http://localhost:3000`*

---

## 🔑 Default Credentials (Pre-Seeded)

The system automatically initializes default user accounts upon first launch:

| Role | Username | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Store Owner** | `owner` | `admin123` | Full Access (Dashboard, Inventory, Khata, Financials) |
| **Cashier** | `cashier` | `cashier123` | POS Counter, Billing, Product Lookup, Day Closing |

---

## 📡 REST API Reference

All backend API endpoints are secured via JWT bearer tokens (except `/api/auth/login`).

| Module | Route | Method | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | `POST` | Authenticates user & returns JWT token |
| **Products** | `/api/products` | `GET` | Get product catalog (supports Roman Urdu & Barcode queries) |
| **Products** | `/api/products` | `POST` | Add a new product (Owner only) |
| **Sales** | `/api/sales` | `POST` | Process customer checkout & issue receipt |
| **Sales** | `/api/sales` | `GET` | View sales history and invoices |
| **Customers** | `/api/customers` | `GET` | List Khata accounts & credit balances |
| **Customers** | `/api/customers/{id}/ledger` | `GET` | Retrieve complete Udhaar transaction history |
| **Inventory** | `/api/inventory/low-stock` | `GET` | Fetch items below minimum stock threshold |
| **Day Closing**| `/api/dayclosing/close` | `POST` | Submit evening cash count & close register |
| **Dashboard** | `/api/dashboard/summary` | `GET` | Fetch sales totals, profits, and KPI metrics |
| **Sync** | `/api/sync/batch` | `POST` | Reconcile and push offline transaction batches |

---

## 🐳 Docker Deployment

To launch the complete stack using Docker Compose:

```bash
docker compose up --build
```

---

## 📤 Pushing to GitHub

To push your repository to GitHub from scratch:

```powershell
# 1. Ensure any nested git folder in frontend is cleared
Remove-Item -Recurse -Force .\frontend\.git -ErrorAction SilentlyContinue

# 2. Stage and commit all files
git init
git add .
git commit -m "feat: initial commit of DukaanOS retail system"
git branch -M main

# 3. Connect to your GitHub repository
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

---

## 📄 License
This project is licensed under the MIT License.
