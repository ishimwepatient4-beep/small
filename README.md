# Inventory MVP

A modern, responsive inventory management web application for small businesses.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, React Query, React Hook Form
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT

## Quick Start (Docker)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Database: localhost:5432

## Manual Setup

### Prerequisites
- Node.js 20+
- PostgreSQL

### Backend
```bash
cd backend
cp .env.example .env  # Edit DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Login

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@example.com  | admin123  |
| User  | user@example.com   | user123   |

## Features

- Authentication (JWT, admin/user roles)
- Dashboard with stats and alerts
- Products CRUD with search/filter/pagination
- Categories CRUD
- Stock In/Out with automatic transaction recording
- Inventory history with filters
- Low stock and out-of-stock alerts
- Reports (Current Inventory, Stock Movement, Low Stock)
- PDF and Excel export
- Dark mode support
- Responsive layout with sidebar navigation

## Project Structure

```
small-inventory/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── products.ts
│       │   ├── categories.ts
│       │   ├── stock.ts
│       │   ├── history.ts
│       │   ├── dashboard.ts
│       │   └── reports.ts
│       ├── utils/
│       │   ├── auth.ts
│       │   └── validators.ts
│       └── index.ts
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Products.tsx
│       │   ├── Categories.tsx
│       │   ├── StockIn.tsx
│       │   ├── StockOut.tsx
│       │   ├── History.tsx
│       │   └── Reports.tsx
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── Topbar.tsx
│       │   └── UI.tsx
│       ├── contexts/
│       │   ├── AuthContext.tsx
│       │   └── ThemeContext.tsx
│       ├── lib/
│       │   └── api.ts
│       └── App.tsx
├── docker-compose.yml
└── README.md
```
