# Death Committee System

A full-stack financial management system for community-based mutual death-support committees.

Built with FastAPI, SQLAlchemy, Alembic, React, TypeScript, Vite, Tailwind CSS, and SQLite.

> Status: Active development / portfolio project

## Overview

The system manages committee members, contributions, dues, death support, goods, shared assets, financial statements, and member settlements.

The project focuses on enforcing financial and authorization rules in the backend rather than treating the application as a simple CRUD system.

## Key Features

- Committee and member management
- Contributions and contribution-rate versioning
- Member dues and payments
- Death-support workflows and Qarz-e-Hasana
- Member goods and valuations
- Committee assets and ownership
- Financial balances and statements
- Member settlements and settlement payments
- Authentication and password recovery
- Role-based and committee-level authorization
- Audit logging
- Double-entry accounting

## Security

The backend enforces authorization independently of frontend visibility.

Committee access is explicitly represented through `UserCommitteeAccess`, allowing users to be assigned to specific committees while keeping committee resources isolated.

### Roles

| Role | Scope |
| --- | --- |
| Super Admin | Platform administration |
| Committee Admin | Assigned committee administration |
| Member | Permitted member functionality |

Security mechanisms include:

- JWT authentication
- Password hashing
- Password recovery with expiring reset tokens
- Active-user validation
- Committee and member authorization
- Explicit committee access control
- Session revocation through token-version invalidation
- Audit logging

## Financial Model

Money is stored as integer PKR values.

Financial transactions use `Account`, `JournalEntry`, and `JournalLine` records. Journal entries must remain balanced.

The accounting layer supports:

- Contributions
- Death support
- Member dues
- Goods and valuations
- Committee assets
- Member balances
- Settlements

Historical accounting records are preserved. Corrections use reversal operations rather than silently changing historical entries.

Contribution rates use effective dates, and asset participation history is preserved for settlement calculations.

## Architecture

### Backend

FastAPI → authorization/dependencies → services → SQLAlchemy models → database

The service layer contains domain and financial rules instead of placing important logic only in route handlers.

Backend domains include authentication, committees, members, contributions, dues, death support, goods, assets, settlements, users, and audit logs.

### Frontend

React + TypeScript + Vite + Tailwind CSS

The frontend provides role-aware pages, responsive layouts, and English/Urdu localization.

Alembic migrations track database schema changes.


## Testing

The verified backend suite contains **82 passing tests** covering authentication, authorization, audit logging, financial integrity, contributions, dues, death support, assets, and settlements.

Frontend verification:

- `npm run build` succeeds
- `npm run lint` reports 0 errors and 9 warnings

Passing tests do not imply complete security coverage or production readiness.

## Run Locally

### Backend

From the project root:

`cd backend`

Activate the virtual environment:

`source .venv/bin/activate`

Start the API:

`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

API documentation: `http://127.0.0.1:8000/docs`

### Frontend

From the project root:

`cd frontend`

Install dependencies:

`npm install`

Start the development server:

`npm run dev`

### Environment

Create the backend environment file:

`cp backend/.env.example backend/.env`

## Technology Stack

**Backend:** Python, FastAPI, SQLAlchemy, Alembic, Pydantic, SQLite, Pytest

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Oxlint

**Development:** Git, GitHub, REST APIs, automated testing, database migrations

## Current Status

Implemented areas include committee and member management, contributions, dues, death support, goods, assets, accounting, settlements, authentication, password recovery, authorization, session revocation, audit logging, responsive UI, and English/Urdu localization.

This is an active portfolio/development project, not a production SaaS or enterprise deployment.

## Roadmap

- PostgreSQL production configuration
- Deployment and CI/CD
- Security scanning
- Expanded reporting and API documentation
- Frontend and end-to-end tests
- Observability and backup/recovery documentation

## License

This project is currently maintained as a portfolio/development project. A formal open-source license will be added when the distribution policy is finalized.

## Author

**Haseeb Ullah Shah**

Software Engineering Student, Pakistan
