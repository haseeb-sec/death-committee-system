# Pilot Runbook

Operational checklist for running the Death Committee System as a controlled pilot.

This runbook describes the actual Docker Compose deployment used by the project: PostgreSQL 17, FastAPI, React/Vite, Nginx, and Caddy HTTPS.

## 1. Prepare the Environment

From the repository root, create the Compose environment file:

`cp .env.example .env`

Set strong random values for `SECRET_KEY` and `POSTGRES_PASSWORD`. Use a `SECRET_KEY` of at least 32 characters. Never commit the real `.env` file.

For the Compose deployment, `DATABASE_URL` must use the PostgreSQL service hostname:

`postgresql+psycopg://death_committee:<password>@postgres:5432/death_committee`

Set `CORS_ORIGINS` to the real browser origin used by the pilot. When the application is accessed through the included Caddy configuration at `https://localhost`, use:

`CORS_ORIGINS=https://localhost`

The root `.env.example` is the Compose template. `backend/.env.example` is for running the backend directly during local development and is not the environment file used by Docker Compose.

## 2. Start the Complete Stack

From the repository root:

`docker compose up -d --build`

The stack contains:

- PostgreSQL 17
- FastAPI backend
- React/Vite frontend built into Nginx
- Caddy HTTPS reverse proxy

PostgreSQL is internal to the Compose network. The backend is also internal and is reached through Caddy. Do not expose PostgreSQL or backend port 8000 directly to the public network.

Check service status:

`docker compose ps`

The backend must become `healthy` before the application is considered ready.

The backend readiness endpoint is:

`/health`

It is intentionally not exposed through the current Caddy configuration. The Docker healthcheck verifies it inside the backend container.

## 3. Bootstrap the First Super Admin

For a fresh database, create the first Super Admin inside the backend container:

`docker compose exec backend python -m app.bootstrap_admin`

The bootstrap command refuses to create the initial account when users already exist.

After bootstrap, open:

`https://localhost`

Accept the local development certificate warning if the browser presents one.

Log in with the Super Admin account created during bootstrap.

## 4. Minimum Pilot Verification

Complete this checklist before introducing real committee data:

1. Confirm Super Admin login works.
2. Create one test committee.
3. Grant the required committee administrator access.
4. Confirm committee isolation by using only the intended committee workspace.
5. Create at least one test member.
6. Record one contribution or equivalent minimal financial transaction.
7. Verify the resulting financial information and statement.
8. Create or inspect a due if the pilot workflow requires one.
9. Verify settlement information loads correctly.
10. Confirm Audit Logs contain the expected administrative/financial activity.
11. Confirm an authenticated API request works through `https://localhost`.
12. Confirm the application remains healthy after the verification flow.

Do not use real committee money data until this complete Compose path has been exercised successfully.

## 5. PostgreSQL Backup

Create a PostgreSQL backup from the repository root:

`bash backend/scripts/backup_postgres.sh`

The script writes a timestamped SQL backup under `backend/backups/`.

Confirm that the backup was created successfully and preserve verified backups separately from the running application where possible.

For pilot financial data, do not rely on an unverified SQLite database or a laptop-only SQLite backup.

## 6. Isolated PostgreSQL Restore Test

Restore a backup into a new, non-live PostgreSQL database:

`bash backend/scripts/restore_postgres.sh <backup.sql> <test_database>`

Example:

`bash backend/scripts/restore_postgres.sh backend/backups/death_committee_YYYYMMDD_HHMMSS.sql recovery_test`

The restore script:

1. Validates the requested target database name.
2. Refuses to restore directly over the live `death_committee` database unless explicitly overridden.
3. Creates an isolated target database.
4. Restores the SQL backup with error-on-failure behavior.
5. Removes a partially created target database if restoration fails.

Confirm that the isolated restore completes successfully.

After verification, remove the temporary recovery database according to the pilot operator procedure. Never use the live production database as the restore test target.

## 7. Rollback

If a deployment change or database migration must be rolled back:

1. Preserve the current state and relevant logs.
2. Stop or isolate application writes if required.
3. Select the last known-good PostgreSQL backup.
4. Restore it into an isolated database first.
5. Confirm the isolated restore succeeds.
6. Follow the deployment operator procedure for restoring service state.
7. Verify login and critical financial operations.
8. Keep the relevant pre-rollback backup until the pilot is confirmed stable.

Do not use the old SQLite backup/restore scripts for the Compose pilot database.

## 8. Caddy and API Route Maintenance

Caddy is the HTTPS entry point for the application.

Current backend API prefixes are explicitly routed in Caddyfile: /auth, /users, /committees, /members, and /audit-logs, including their bare prefix paths where applicable. Nested contribution, settlement, dues, goods, death-support, and asset endpoints are covered by the /committees/* or /members/* rules; do not add separate top-level proxy rules for those nested paths. /assets/* is frontend static content, not a backend API prefix. If a new backend route introduces a new top-level API prefix, update and validate Caddyfile before deploying it.

Validate the configuration with:

`docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile`

After changing Caddy routing, verify the affected endpoint through the real HTTPS origin rather than testing only against the internal backend container.

## 9. Environment and Secret Rules

- Never commit `.env`.
- Use strong unique values for `SECRET_KEY` and `POSTGRES_PASSWORD`.
- Keep real financial data out of source control.
- Do not expose PostgreSQL port 5432 publicly.
- Do not expose backend port 8000 publicly.
- Use the Caddy HTTPS endpoint for pilot access.
- Keep verified PostgreSQL backups separate from the application where practical.

## 10. Pilot Boundary

This is a controlled single-committee pilot deployment, not a claim of fully hardened public SaaS infrastructure.

Known residual production concerns include:

- Login and password-reset rate limiting is in-memory and therefore intended for a single-instance deployment.
- Off-host automated backup retention is not provided by the repository itself.
- External monitoring and alerting are not included.
- Caddy local certificates are suitable for the included local HTTPS setup; a public deployment requires an appropriate production certificate and domain configuration.
- Production secret management should use the deployment environment or secret-management system appropriate to the host.

The pilot must use the PostgreSQL Docker Compose path described in this document.

Never put real committee financial data on the legacy SQLite development path or rely on a laptop-only SQLite setup.

## 11. Pilot Completion Criteria

A pilot is considered operationally ready for one trusted committee only after all of the following have been completed successfully:

- [ ] Root `.env` created from `.env.example`
- [ ] Strong `SECRET_KEY` configured
- [ ] Strong `POSTGRES_PASSWORD` configured
- [ ] `DATABASE_URL` points to the Compose `postgres` service
- [ ] `CORS_ORIGINS` matches the actual pilot browser origin
- [ ] `docker compose up -d --build` succeeds
- [ ] Backend reports healthy
- [ ] First Super Admin successfully bootstrapped
- [ ] Super Admin login succeeds through HTTPS
- [ ] One committee and required access are verified
- [ ] One financial transaction is recorded and verified
- [ ] Audit logging is verified
- [ ] PostgreSQL backup succeeds
- [ ] Isolated PostgreSQL restore succeeds
- [ ] Repository working tree contains no accidental secret or database files

Do not claim pilot readiness until the complete Compose startup, authenticated financial-flow, backup, and isolated-restore sequence has succeeded once.
