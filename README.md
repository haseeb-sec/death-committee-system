# Death Committee System

A full-stack financial management system for community-based mutual death-support committees.

Built with FastAPI, SQLAlchemy, Alembic, React, TypeScript, Vite, Tailwind CSS, and SQLite.

> Status: Active development / portfolio project

## Overview

The system manages committee members, contributions, dues, death support, goods, shared assets, financial statements, and member settlements.

The project focuses on enforcing financial, authorization, and accounting rules in the backend rather than treating the application as a simple CRUD system.

## Key Features

- Committee and member management
- Contributions and contribution-rate versioning
- Member dues and payments
- Death-support workflows and Qarz-e-Hasana
- Member goods and valuation history
- Committee assets and valuation history
- Financial balances and statements
- Member settlements and settlement payments
- Authentication and password recovery
- Role-based and committee-level authorization
- Audit logging
- Double-entry accounting
- English/Urdu localization
- Responsive frontend for desktop and mobile layouts

## Security

The backend is the security boundary. Frontend role checks and page visibility do not replace backend authorization.

### Roles

| Role | Scope |
| --- | --- |
| Super Admin | Platform administration |
| Committee Admin | Assigned committee administration |
| Member | Permitted member functionality |

Security controls include:

- JWT authentication
- Required JWT claims and signature/expiry validation
- Password hashing
- Expiring, single-use password-reset tokens
- Active-user validation
- Login abuse protection for repeated failed attempts
- Session revocation through token-version invalidation
- Explicit committee access control
- Role-based and member-level authorization
- Cross-committee and ownership checks
- Security response headers
- Configurable CORS origins
- Input validation and password-length policy
- Financial chronology and consistency checks
- Database uniqueness constraints for valuation/rate history
- Audit logging
- Dependency vulnerability scanning through CI

See [`SECURITY.md`](SECURITY.md) for the security model, limitations, and development practices.

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

Contribution rates use effective dates. Valuation history for member goods and committee assets is chronological and does not allow duplicate valuation dates for the same item.

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

The verified backend suite currently contains **103 passing tests** covering authentication, authorization, audit logging, financial integrity, contributions, dues, death support, goods, assets, settlements, password security, and related security regressions.

Frontend verification includes production builds and lint checks during development and CI.

Passing tests do not imply complete security coverage or production readiness.

## CI and Security Scanning

GitHub Actions runs backend tests and frontend checks on pushes and pull requests to `main`.

The CI workflow also runs dependency vulnerability checks for the backend and frontend.

These checks are intended to catch regressions and known dependency vulnerabilities; they do not replace manual security review.

## Run Locally

### Backend

From the project root:

`cd backend`

Activate the virtual environment:

`source .venv/bin/activate`

Start the API:

`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

API documentation:

`http://127.0.0.1:8000/docs`

### Frontend

From the project root:

`cd frontend`

Install dependencies:

`npm install`

Start the development server:

`npm run dev`

The frontend uses the normal Vite development port `5173`.

### Environment

Create the backend environment file:

`cp backend/.env.example backend/.env`

Use a long random value for `SECRET_KEY`. Never commit the real `.env` file.

## Technology Stack

**Backend:** Python, FastAPI, SQLAlchemy, Alembic, Pydantic, SQLite, Pytest

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Oxlint

**Development:** Git, GitHub, REST APIs, automated testing, database migrations

## Current Status

Implemented areas include committee and member management, contributions, dues, death support, goods, assets, accounting, settlements, authentication, password recovery, authorization, session revocation, audit logging, security controls, responsive UI, and English/Urdu localization.

This is an active portfolio/development project, not a production SaaS or enterprise deployment.

## Roadmap

- PostgreSQL production configuration
- Deployment and production infrastructure hardening
- Expanded reporting and API documentation
- Frontend and end-to-end tests
- Observability
- Backup and recovery procedures
- Production security configuration review

## License

This project is currently maintained as a portfolio/development project. A formal open-source license will be added when the distribution policy is finalized.

## Author

**Haseeb Ullah Shah**

Software Engineering Student, Pakistan
