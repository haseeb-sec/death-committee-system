# Death Committee System

A full-stack, multi-tenant financial management platform for community-based mutual death-support committees.

Built with **FastAPI, SQLAlchemy, Alembic, React, TypeScript, Vite, Tailwind CSS, and SQLite**, the system combines committee management with authentication, role-based authorization, financial workflows, double-entry accounting, asset management, dues, death support, and member settlement.

> **Status:** Active development / portfolio project

---

## Overview

The Death Committee System manages the financial and administrative lifecycle of community-based mutual death-support committees. It is designed around enforceable business rules, financial integrity, and strict committee-level authorization rather than simple CRUD operations.

Core capabilities include:

- Committee and member management
- Contribution rates and contributions
- Member dues and payments
- Death-support payments
- Member-owned goods and valuations
- Shared committee assets and ownership
- Asset valuation history
- Member financial balances and statements
- Member exit and settlement
- Settlement payments
- Authentication and password recovery
- Role-based authorization
- Multi-committee access control
- Audit logging
- Financial integrity testing

---

## Engineering Highlights

### Multi-tenant committee isolation

Users receive access to committees through UserCommitteeAccess. Each committee maintains isolated members, contributions, dues, death-support records, goods, assets, accounts, journal entries, and settlements.

Authorization is enforced by the backend rather than relying on frontend visibility.

### Role-based access control

| Role | Scope |
|---|---|
| **Super Admin** | Platform-level administration |
| **Committee Admin** | Management of explicitly assigned committees |
| **Member** | Permitted member functionality |

Backend authorization includes committee-level and member-level checks such as require_committee_access(), require_committee_admin_access(), and require_member_access().

### Authentication

Authentication uses OAuth2 password login, JWT access tokens, password hashing, password recovery, reset-token expiration, active-user checks, and authentication audit logging.

---

## Financial Architecture

Money is stored as **integer PKR values** rather than floating-point values.

### Double-entry accounting

Financial transactions are represented through Account, JournalEntry, and JournalLine records.

Every journal entry must be balanced:
```text
Total journal amounts = 0
```



The accounting service rejects unbalanced entries, zero-value journal lines, missing accounts, and invalid journal structures. Journal entries can also be reversed without modifying the original historical entry.

This accounting model supports contributions, death support, dues, goods, assets, and member settlements.

---

## Financial Workflows

The accounting and financial services support workflows including:

### Contributions

Members contribute according to the committee's configured contribution rate.

Contribution rates are versioned using an effective date so historical financial records are not silently changed when a committee changes its contribution amount.

### Death support

Death-support payments are recorded against the member's financial position.

When requested support exceeds the member-funded balance, the system can represent the remaining amount as **Qarz-e-Hasana** through member dues.

### Member dues

The system tracks outstanding dues and payments, including dues generated through financial workflows such as Qarz-e-Hasana.

### Goods

Members can have goods recorded and valued as part of their financial position.

### Committee assets

Shared committee assets support:

- Purchase records
- Current valuations
- Valuation history
- Member participation
- Ownership allocation
- Historical participation records

### Member settlement

A member's final settlement is calculated from multiple financial components rather than simply returning total contributions.

The settlement model accounts for:

    Contribution Balance
    + Asset Share
    + Goods Value
    - Outstanding Dues
    -----------------------
    = Final Settlement

Settlement payments are tracked separately from settlement calculation.

Historical financial records are preserved rather than overwritten when assets are revalued or settlements are processed.

---

## Committee Access Architecture

Committee access is represented explicitly through:

    User
     |
     +-- UserCommitteeAccess
           |
           +-- Committee A
           |     +-- Members
           |     +-- Contributions
           |     +-- Dues
           |     +-- Death Support
           |     +-- Goods
           |     +-- Assets
           |     +-- Settlements
           |
           +-- Committee B
                 +-- Members
                 +-- Contributions
                 +-- Dues
                 +-- Death Support
                 +-- Goods
                 +-- Assets
                 +-- Settlements

This is an intentional application-level multi-tenancy model.

A user may have access to multiple committees while committee-specific resources remain isolated.

`UserCommitteeAccess` also records whether the user has administrative authority for that specific committee.

---

## Security Model

Security is implemented at the backend rather than only through frontend controls.

The system includes:

- JWT authentication
- Password hashing
- Password recovery
- Expiring password reset tokens
- Active user validation
- Role-based authorization
- Committee-level authorization
- Member-level authorization
- Committee administrator authorization
- Audit logging
- Explicit user-to-committee access records
- Financial integrity validation

The frontend can hide or disable actions that a user cannot perform, but those UI controls are not considered the security boundary.

Protected API operations independently validate the authenticated user's authority.

---

## Auditability

Authentication and important application operations can be recorded through the audit logging subsystem.

The project also preserves accounting history through journal entries.

Rather than modifying historical journal entries to correct financial operations, the accounting service supports journal-entry reversal.

A reversal creates a new balanced entry with opposite amounts while preserving the original journal entry.

This provides a more traceable financial history.

---

## Testing

Automated tests cover important business and security behavior.

The test suite includes areas such as:

- Authentication
- Password changes
- Password recovery
- Authorization
- Committee access
- Committee isolation
- API authorization
- Financial integrity
- Financial invariants
- Contributions
- Death support
- Member dues
- Settlement calculations
- Settlement payments
- Settlement goods
- Committee assets
- Asset participation
- Audit behavior

Run the backend test suite with:

    cd backend
    pytest -q

The project has previously reached a verified development checkpoint of:

    46/46 backend tests passing
    20/20 authorization tests passing

These numbers describe a development checkpoint rather than a claim of permanent test count or complete coverage.

---

## Backend Architecture

The backend is organized around FastAPI services and domain-oriented modules.

    backend/
    +-- app/
    |   +-- api/
    |   +-- core/
    |   +-- db/
    |   +-- models/
    |   +-- schemas/
    |   +-- services/
    |
    +-- alembic/
    |   +-- versions/
    |
    +-- tests/
    +-- requirements.txt
    +-- .env.example

### API layer

The API layer exposes endpoints for:

- Authentication
- Users
- Permissions
- Committees
- Members
- Contributions
- Dues
- Goods
- Death support
- Assets
- Settlements

### Service layer

Business rules are implemented primarily in services rather than being placed directly inside route handlers.

Examples include:

- `accounting.py`
- `access_control.py`
- `committee.py`
- `committee_financial.py`
- `committee_summary.py`
- `contribution.py`
- `death_support.py`
- `member_balance.py`
- `member_due.py`
- `member_financial.py`
- `member_settlement.py`
- `member_statement.py`
- `committee_asset.py`
- `asset_ownership.py`

---

## Database

The project currently uses **SQLite** for development.

Database schema changes are managed using **Alembic migrations**.

The repository does not intentionally track local development database files.

For production use, a database such as PostgreSQL would be a natural future direction.

---

## Frontend

The frontend is a React + TypeScript application built with Vite and Tailwind CSS.

The application provides a professional management interface for areas including:

- Dashboard
- Committees
- Members
- Contributions
- Dues
- Goods
- Assets
- Death support
- Settlements
- User and access management

The committee is treated as the primary application context.

Switching committees is designed to reload committee-specific data and prevent stale data from the previously selected committee from remaining visible.

---

## Frontend Architecture

    frontend/
    +-- public/
    +-- src/
    |   +-- App.tsx
    |   +-- App.css
    |   +-- index.css
    |   +-- main.tsx
    +-- package.json
    +-- package-lock.json
    +-- vite.config.ts
    +-- tsconfig.json

The frontend uses:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- TypeScript type checking
- Oxlint

Build the frontend with:

    cd frontend
    npm install
    npm run build

Run the development server with:

    npm run dev

---

## Running Locally

### Backend

From the project root:

    cd backend
    source .venv/bin/activate
    uvicorn app.main:app --reload

The API is available at:

    http://127.0.0.1:8000

Interactive API documentation:

    http://127.0.0.1:8000/docs

### Frontend

In another terminal:

    cd frontend
    npm install
    npm run dev

Vite will display the local development URL.

### Environment configuration

Create a local environment file from the example:

    cp backend/.env.example backend/.env

The real `.env` file is intentionally excluded from version control.

Never commit production secrets, JWT signing keys, database files, or other credentials.

---

## API

The backend exposes a REST API through FastAPI.

The interactive Swagger documentation is available during development at:

    /docs

The API is organized around domain resources rather than exposing the database directly.

Authorization is applied to protected operations before business actions are performed.

---

## Database Migrations

Alembic is used for schema evolution.

Typical development command:

    cd backend
    alembic upgrade head

Create a migration when the database model changes:

    alembic revision --autogenerate -m "describe schema change"

Review autogenerated migrations carefully before applying them.

---

## Project Structure

    death-committee-system/
    |
    +-- README.md
    +-- .gitignore
    |
    +-- backend/
    |   +-- app/
    |   |   +-- api/
    |   |   +-- core/
    |   |   +-- db/
    |   |   +-- models/
    |   |   +-- schemas/
    |   |   +-- services/
    |   |
    |   +-- alembic/
    |   |   +-- versions/
    |   |
    |   +-- tests/
    |   +-- requirements.txt
    |   +-- .env.example
    |
    +-- frontend/
        +-- public/
        +-- src/
        +-- package.json
        +-- package-lock.json
        +-- vite.config.ts
        +-- tsconfig.json

---

## Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- SQLite
- JWT
- Argon2/password hashing
- pytest

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Oxlint

### Development

- Git
- GitHub
- Linux/WSL development environment

---

## Engineering Decisions

### Integer monetary values

Financial amounts are stored as integer PKR values.

This avoids floating-point arithmetic for monetary calculations.

### Centralized authorization

Access checks are implemented in backend services and reused by API operations.

This avoids relying on individual route handlers or frontend UI state to enforce security.

### Explicit committee access

Users are not assumed to have access to every committee simply because they have an account.

Committee access is represented explicitly through `UserCommitteeAccess`.

### Immutable accounting history

Financial history is represented through journal entries.

Corrections can be represented through reversals instead of silently modifying historical journal data.

### Versioned contribution rates

Contribution rates are versioned using effective dates so historical contribution calculations remain meaningful when the committee changes its rate.

### Historical asset participation

Asset participation and ownership information is preserved so member settlements can use historically meaningful ownership information.

---

## Current Status

The project is an **active portfolio/development project**.

Implemented areas include:

- Committee lifecycle
- Member lifecycle
- Contribution management
- Contribution rate versioning
- Double-entry accounting foundation
- Death-support workflows
- Member dues
- Goods and valuations
- Committee assets
- Asset valuations
- Asset participation
- Member financial balances
- Member statements
- Member settlement
- Settlement payments
- Authentication
- Password recovery
- Role-based authorization
- Committee-level access control
- Audit logging
- Financial integrity testing
- React/TypeScript management interface

The project is not presented as a production SaaS deployment or enterprise-scale system.

---

## Roadmap

Potential future improvements include:

- PostgreSQL production configuration
- Production deployment
- CI/CD pipeline
- Automated security scanning
- Expanded API documentation
- Expanded financial reporting
- Better reporting/export capabilities
- Additional frontend test coverage
- End-to-end testing
- Production observability
- Backup and recovery strategy
- Deployment documentation

---

## Portfolio Focus

This project demonstrates practical engineering experience in:

- Full-stack application development
- REST API design
- Authentication
- Role-based authorization
- Multi-tenant data isolation
- Relational database design
- SQLAlchemy ORM
- Alembic migrations
- Financial business logic
- Double-entry accounting concepts
- Financial integrity constraints
- Asset ownership and valuation
- Member settlement calculations
- Automated testing
- React and TypeScript
- Professional management UI design

The most important aspect of the project is not the number of screens. It is the attempt to model **real financial and authorization rules as enforceable backend business logic**.

---

## License

This project is currently maintained as a portfolio/development project.

A formal open-source license will be added when the repository's distribution policy is finalized.

---

## Author

**Haseeb Ullah Shah**

Software Engineering Student
Pakistan

---
