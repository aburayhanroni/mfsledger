# Single-Page Dual-Shop MFS Ledger

A lightweight, single-page web application designed for mutual MFS (bKash, Nagad, Rocket, Upay) ledger tracking between two partnered shops (Shop A and Shop B).

## Tech Stack
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Backend / API:** Next.js Route Handlers (App Router)
- **Frontend:** React 19 + Tailwind CSS + Lucide Icons
- **Tooling:** Neon CLI (`neonctl`), Neon MCP Server, Neon Agent Skills

## Features
- **Phone Number Authentication:** No passwords / OTP required. Enter shop phone number with instant switching between Shop A and Shop B.
- **Mutual Net Balance Tracker:** Live calculation of who owes whom, including today's Given vs Taken amounts.
- **Full MFS Support:** bKash, Nagad, Rocket, and Upay with custom brand themes.
- **Proof & TrxID Management:** Copy transaction IDs with one click, upload and preview screenshot proofs.
- **Status Workflows:** Update transaction status (`pending`, `sent`, `received`, `rejected`).
- **Dynamic Filtering:** Filter transactions by date range (Today, All time), MFS provider, and status.

## Getting Started

### 1. Database & Migrations
The Neon database is linked via `.neon` and configured in `.env.local`. Run migrations with:
```bash
npm run db:migrate
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Verify Database with Neon CLI
Connect directly via Neon CLI:
```bash
npx neonctl psql
```
or inspect branches and tables:
```bash
npx neonctl branches list
```

