# Pilot Verification Notes

Date: 2026-10-12
Scope: Controlled single-committee pilot; not public SaaS certification.

- Docker Compose configuration validated; services were built and started.
- HTTPS application root returned HTTP 200.
- Backend health endpoint returned status ok inside its container.
- Local proxy on 127.0.0.1:8080 returned HTTP 200.
- Super Admin login through local HTTPS was confirmed.
- Committee 8 and its user access assignments were inspected read-only.
- Existing contribution journal entry 17 was inspected; its two lines net to zero.
- Contribution rate 5 is PKR 1,000 effective 2026-10-12.
- Audit events 228 and 229 document creation of the rate and contribution.
- Contribution API tests passed: 7 tests.
- Authorization regression tests passed: 35 tests.
- Contribution amount UI was built and deployed; no extra live payment was recorded.
- Pre-reset SQL backup checksum retained for reference: 57d251869278254fa30d589c0641c3271b3f0dcad84be8871d092359f848705b.
- Fresh SQL backup created at `backend/backups/death_committee_20261012_222248.sql`; SHA-256: `8fd4a806e78fd2fb696e09ea08b088937574141f2439d6d8131db977ff6776e5`.
- Fresh backup restored successfully into isolated database `pilot_restore_20261012_222248`.
- All 19 table row counts matched between the live database and isolated restore.
- The checked restore queries found no unbalanced journal entries or orphaned journal lines; this was not an exhaustive audit of all database constraints.
- The earlier temporary recovery database was removed after its separate verification; the fresh restore database was also removed after the 2026-10-12 verification. The live `death_committee` database was retained.
- Full end-to-end pilot workflow and external-device access have not been claimed as verified here.
- Remaining operational work: off-host backup retention, hosting-specific TLS/secrets, and monitoring.

## Verification update — 2026-10-13

- Authorization commit `0604cbb` pushed to `origin/main`.
- Backend rebuilt and redeployed from the committed code.
- Backend container reported healthy; `/health` returned HTTP 200 with `{"status":"ok"}`.
- Post-deployment backend test suite: 137 passed in 39.97 seconds.
- Windows Tailscale Serve hostname and local proxy checked; local application returned HTTP 200.
- Realme C61 appeared online in the committee Tailscale network.
- Committee application opened on Android over Tailscale HTTPS.
- Committee administrator login and dashboard/committee data were confirmed by the administrator.
- Full genuine committee workflow and member use remain unverified.

## Verification update — 2026-10-17

Scope: Docker web-port binding and private Tailscale access. This update does
not certify the application as public-Internet-ready or claim that every
possible network path has been tested.

- Updated the Caddy port mappings in `compose.yml` to bind ports 80 and 443
  to `127.0.0.1`, retaining port 8080 on `127.0.0.1` for the Tailscale Serve
  proxy. The change remains uncommitted until separately reviewed.
- Recreated the Caddy container. Compose reported these published bindings:
  `127.0.0.1:80->80/tcp`, `127.0.0.1:443->443/tcp`, and
  `127.0.0.1:8080->8080/tcp`.
- Local HTTPS check to `https://localhost/` returned HTTP 200.
- Local proxy check to `http://127.0.0.1:8080/` returned HTTP 200.
- Windows `Get-NetTCPConnection` showed listeners on `127.0.0.1` for ports
  80, 443, and 8080. The observed port-443 listeners on the Tailscale IPv4
  and IPv6 addresses belong to the Tailscale process; these are expected for
  the private HTTPS service.
- `tailscale serve status` reported the tailnet-only hostname
  `https://desktop-5hoc679.tail9e65e4.ts.net`, proxying to
  `http://127.0.0.1:8080`.
- The user confirmed that the application login page loaded on a second
  device through that Tailscale HTTPS hostname.
- `git diff --check` passed during the original network verification, when
  `compose.yml` was the only modified tracked file. Documentation changes
  were added afterward.
- These checks support the intended private access configuration. They do not
  constitute a full penetration test, prove every LAN/Internet path is blocked,
  or validate a public-domain production TLS configuration.

Pilot limitations remain: full real-world committee workflows and member use
are not yet fully demonstrated; off-host backup retention, external monitoring,
and production-specific TLS and secret management remain operational tasks.

### Regression and service verification — 2026-10-17

- Full backend test suite: 137 passed in 43.43 seconds.
- Frontend production build: TypeScript compilation and Vite build succeeded.
- Compose services: PostgreSQL and backend reported healthy; frontend and Caddy
  were running.
- Local HTTPS root returned HTTP 200.
- Local Tailscale proxy endpoint returned HTTP 200.
- Caddy configuration validation reported `Valid configuration`. The validator
  emitted a non-fatal formatting warning; no Caddyfile formatting change was
  made as part of this verification.
- The frontend build was verified locally. The running frontend container was
  not rebuilt or redeployed because no frontend source change was part of this
  verification step.

### Backup restore integrity verification — 2026-10-17

- Backup: `backend/backups/death_committee_20261017_182855.sql`.
- SHA-256: `dfef9a16550e8e9e47e19d1c963b3321d085d214e64d3994c0c7466e4aa6f882`.
- The SQL dump contains 19 table definitions and 19 public-table data sections.
- Restored into the existing isolated database
  `pilot_restore_20261017_182855`; the live database was not modified.
- Both databases contain the same 19 public tables.
- Row counts match for 18 tables. `audit_logs` has 38 rows in the live
  database and 36 in the restored database. Live-only IDs 255 and 256 are
  login events. Their timing relative to the backup snapshot has not been
  conclusively established because timestamp conventions have not been
  reconciled; this difference is documented rather than silently ignored.
- Journal integrity checks passed in both databases: zero unbalanced entries,
  zero entries without lines, and zero orphan journal lines.
- This verifies the tested backup's restore and the checks listed above; it
  does not prove every application workflow, off-host backup recovery, or
  overall production readiness.
