# Pilot Runbook

Operational checklist for running the Death Committee System as a controlled pilot.

## 1. Environment

Create the backend environment file:

`cp backend/.env.example backend/.env`

Set a strong random `SECRET_KEY`. Never commit the real `.env` file.

Current development database: `backend/committee.db`

Migrations use Alembic.

The backend uses port `8000` and the frontend uses Vite port `5173`.

## 2. Initialize the Database

From the repository root:

`backend/.venv/bin/alembic -c backend/alembic.ini upgrade head`

For a fresh database, create the first Super Admin:

`backend/.venv/bin/python backend/app/bootstrap_admin.py`

The bootstrap command refuses to run if users already exist.

## 3. Start the Application

Backend:

`cd backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000`

Frontend, in another terminal:

`npm run dev -- --host 0.0.0.0`

The frontend uses port `5173`.

## 4. Backup

Create a verified SQLite backup:

`backend/.venv/bin/python backend/scripts/backup_db.py`

Backups are written to `backend/backups/`.

The backup utility performs a SQLite integrity check before reporting success.

For a real pilot, verified backups should be copied to storage separate from the application machine.

## 5. Restore

Stop the application before restoring the database.

Restore a known-good backup:

`backend/.venv/bin/python backend/scripts/restore_db.py <backup_path> backend/committee.db`

The restore utility:

1. Verifies the backup.
2. Creates a safety copy of the current database.
3. Restores the selected backup.
4. Runs an integrity check on the restored database.

Start the application again only after the restore succeeds.

## 6. Rollback

If a deployment or database change must be rolled back:

1. Stop the backend and frontend.
2. Preserve the current database.
3. Select the last known-good verified backup.
4. Restore it using the restore utility.
5. Confirm the database integrity check reports `ok`.
6. Start the application.
7. Verify login and critical financial operations.
8. Keep the pre-rollback safety copy until the pilot is confirmed stable.

Do not delete the safety copy immediately after a rollback.

## 7. Minimum Pilot Verification

After deployment or restore, verify:

- Super Admin login works.
- Committee access is correct.
- Member access is restricted to the correct committee/member.
- Contributions and dues load correctly.
- Settlement operations load correctly.
- Financial balances and statements load correctly.
- Audit logs retain committee context.
- The application can create a fresh verified backup.

## 8. Current Infrastructure Boundary

This runbook describes the current controlled development/pilot setup.

The application is not yet a production SaaS deployment.

Before handling real production data, the infrastructure path should include:

- PostgreSQL
- Docker/Compose or equivalent reproducible deployment
- HTTPS
- Production secret management
- Externalized backup storage
- Tested backup retention
- Restore testing
- Production rate limiting
- Monitoring and observability
- Deployment and rollback procedures
