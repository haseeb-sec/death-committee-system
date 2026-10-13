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
