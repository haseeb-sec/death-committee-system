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
- SQL backup checksum verified: 57d251869278254fa30d589c0641c3271b3f0dcad84be8871d092359f848705b.
- Isolated restore succeeded; 19 tables and sampled row counts were verified.
- Restored journal entries had zero unbalanced entries; no unvalidated foreign-key or check constraints were found.
- Temporary recovery database was removed; both live databases remained present.
- Full end-to-end pilot workflow and external-device access have not been claimed as verified here.
- Remaining operational work: off-host backup retention, hosting-specific TLS/secrets, and monitoring.
