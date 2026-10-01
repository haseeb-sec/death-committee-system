# Death Committee System

A full-stack financial management system for community-based mutual death-support committees.

Built with FastAPI, SQLAlchemy, Alembic, React, TypeScript, Vite, Tailwind CSS, and PostgreSQL.

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
- Database uniqueness and financial-integrity constraints
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

Member financial shortfalls that are supported by the committee are represented as Qarz-e-Hasana obligations and tracked through member dues.

## Architecture

### Backend

FastAPI → authorization/dependencies → services → SQLAlchemy models → PostgreSQL

The service layer contains domain and financial rules instead of placing important logic only in route handlers.

Backend domains include authentication, committees, members, contributions, dues, death support, goods, assets, settlements, users, and audit logs.

### Frontend

React + TypeScript + Vite + Tailwind CSS

The frontend provides role-aware pages, responsive layouts, and English/Urdu localization.

### Deployment

The application is containerized with Docker Compose.

The deployed architecture is:

- Browser → Caddy HTTPS reverse proxy
- Caddy → Frontend (Nginx)
- Caddy → Backend (FastAPI/Uvicorn)
- Backend → PostgreSQL 17

Caddy terminates HTTPS and routes application requests to the frontend or backend.

PostgreSQL is internal to the Docker Compose network and is not exposed directly to the host.

### Database Migrations

Alembic manages database schema migrations.

The migration chain currently has a single head. Pending migrations are automatically applied when the backend container starts, before the FastAPI application begins serving requests.

## Testing

The current verified backend suite contains **122 passing tests** covering authentication, authorization, audit logging, financial integrity, contributions, dues, death support, goods, assets, settlements, password security, and related security regressions.

Frontend verification includes successful production builds and lint checks during development and CI.

Passing tests do not imply complete security coverage or eliminate the need for deployment-specific operational controls.

## Backup and Recovery

### PostgreSQL Backups

PostgreSQL backups are created with:

`bash backend/scripts/backup_postgres.sh`

The script creates timestamped plain SQL backups under:

`backend/backups/`

### PostgreSQL Recovery

PostgreSQL backups can be restored into an isolated database for recovery testing with:

`bash backend/scripts/restore_postgres.sh <backup.sql> <target_database>`

The restore script:

- Requires an existing SQL backup file
- Validates the target database name
- Refuses to overwrite an existing database
- Refuses restoration into the live `death_committee` database unless explicitly overridden
- Restores with `ON_ERROR_STOP`
- Removes a partially restored isolated database if restoration fails

A fresh PostgreSQL backup and isolated restore have been successfully verified during development.

## CI and Security Scanning

GitHub Actions runs backend tests and frontend checks on pushes and pull requests to `main`.

The CI workflow also runs dependency vulnerability checks for the backend and frontend.

These checks are intended to catch regressions and known dependency vulnerabilities; they do not replace manual security review.

## Run Locally

### Docker Compose

The complete application stack can be started with:

`docker compose up -d --build`

The stack includes:

- PostgreSQL 17
- FastAPI backend
- React/Vite frontend served by Nginx
- Caddy HTTPS reverse proxy

The backend automatically applies pending Alembic migrations during startup.

### Backend Development

From the project root:

`cd backend`

Activate the virtual environment:

`source .venv/bin/activate`

Start the API directly:

`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

API documentation:

`http://127.0.0.1:8000/docs`

### Frontend Development

From the project root:

`cd frontend`

Install dependencies:

`npm install`

Start the development server:

`npm run dev`

The frontend uses the normal Vite development port `5173`.

### Environment

For local backend development, create the backend environment file:

`cp backend/.env.example backend/.env`

For Docker Compose, create the root environment file used by Compose:

`cp .env.example .env`

Use long random values for `SECRET_KEY` and `POSTGRES_PASSWORD`. Never commit either real `.env` file.

The backend and Docker Compose templates use different database hostnames because local development connects to PostgreSQL on the host, while Compose connects to the postgres service inside the Docker network.

## Technology Stack

**Backend:** Python, FastAPI, SQLAlchemy, Alembic, Pydantic, PostgreSQL, Pytest

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Oxlint

**Infrastructure:** Docker, Docker Compose, Caddy, Nginx

**Development:** Git, GitHub, REST APIs, automated testing, database migrations

## Current Status

Implemented and verified areas include:

- Committee and member management
- Contributions and contribution-rate versioning
- Member dues and payments
- Death support and Qarz-e-Hasana
- Member goods and valuation history
- Committee assets and valuation history
- Double-entry accounting
- Financial statements
- Member settlements and settlement payments
- Authentication and password recovery
- Role-based and committee-level authorization
- Session revocation
- Audit logging
- Financial database integrity constraints
- PostgreSQL deployment configuration
- Automatic database migrations
- HTTPS reverse proxy configuration
- PostgreSQL backup and isolated restore procedures
- Responsive UI
- English/Urdu localization
- 122 verified backend tests

This is an active portfolio/development project rather than a managed production SaaS service. Deployment-specific secrets, infrastructure monitoring, external backup storage, and operational procedures still depend on the target hosting environment.

## Roadmap

- Expanded reporting and API documentation
- Frontend and end-to-end test coverage
- Observability and operational monitoring
- Deployment-specific production security configuration
- External/off-host backup strategy
- Formal open-source licensing if distribution policy is finalized

## License

This project is currently maintained as a portfolio/development project. A formal open-source license will be added when the distribution policy is finalized.

## Author

**Haseeb Ullah Shah**

Software Engineering Student, Pakistan
