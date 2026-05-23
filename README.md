# SalesSphere AI

Smart Monthly Sales Analysis Dashboard built with React, TypeScript, Flask, MySQL, Recharts, JWT auth, report exports, and optional xAI Grok integration.

## Features

- JWT login, signup, profile update, password reset flow
- Dashboard KPIs, monthly revenue, category, region, and top-product charts
- Product, sales, notifications, reports, analytics, admin, and AI assistant modules
- CSV, Excel, and PDF exports
- Mock AI insights by default, with Grok API support through `GROK_API_KEY`
- Dark and light theme frontend with responsive SaaS dashboard layout
- Docker Compose setup for frontend, backend, and MySQL

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Open the app at `http://localhost:5173`.

Default seeded login:

```text
Email: admin@salessphere.ai
Password: admin123
```

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Seed database:

```bash
cd backend
python seed.py
```

## Environment

Copy `.env.example` to `.env`, then update MySQL, mail, and Grok credentials as needed. If `GROK_API_KEY` is empty, the AI assistant returns deterministic mock insights suitable for demos.

## Verification

```bash
cd frontend
npm run build

cd ..
python -m compileall backend
```
