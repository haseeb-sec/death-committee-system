# Death Committee System

A financial management system for community-based mutual death-support committees.

The system manages members, contributions, death-support payments, dues, member-owned goods, shared committee assets, accounting records, valuations, and final member settlements.

## Status

Backend core: implemented and tested
Frontend: next phase
Deployment: planned

## Features

- Committee and member management
- Contribution tracking
- Double-entry accounting foundation
- Death-support management
- Member dues and payments
- Member-owned goods and valuations
- Shared committee assets
- Asset ownership and valuation history
- Member financial summaries and statements
- Member exit and settlement
- Settlement payment tracking
- Financial integrity tests
- REST API with FastAPI
- Alembic database migrations

## Financial Integrity

Money is stored as integer PKR values; floating-point arithmetic is avoided.

Member settlement accounts for:

Contribution balance
+ Asset share
+ Goods value
- Outstanding dues
= Final settlement

Financial operations use balanced journal entries and journal lines to maintain accounting integrity.

## Technology

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- SQLite
- React
- TypeScript
- Vite
- Tailwind CSS
- pytest
- Git
- GitHub

## Project Structure

death-committee-system/
├── backend/
│   ├── app/
│   ├── alembic/
│   └── tests/
├── frontend/
├── docs/
├── .gitignore
└── README.md

## Running the Backend

cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

API: http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs

## Testing

cd backend
pytest -q

## Roadmap

- [x] Core backend
- [x] Accounting foundation
- [x] Contributions
- [x] Death support
- [x] Dues
- [x] Goods
- [x] Committee assets
- [x] Asset valuations
- [x] Member settlement
- [x] Settlement payments
- [x] Financial integrity tests
- [ ] Backend hardening
- [ ] Authentication and authorization
- [ ] React frontend
- [ ] Admin dashboard
- [ ] Financial reports
- [ ] PostgreSQL production setup
- [ ] Deployment
- [ ] CI/CD
- [ ] Security review

## Portfolio

This project demonstrates practical experience with backend architecture, REST API development, relational database design, financial business logic, database migrations, automated testing, and transaction integrity.

## License

To be determined.
