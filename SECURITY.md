# Security

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately rather than opening a public GitHub issue.

Include:

- A clear description of the vulnerability
- Steps to reproduce it
- The affected endpoint, feature, or component
- The potential security impact
- Any suggested remediation, if available

Please do not include real credentials, secrets, personal data, or other sensitive information in reports.

## Security Model

The backend is the security boundary. Frontend role checks and page visibility are for usability and do not replace backend authorization.

The application uses:

- JWT-based authentication
- Required token claims with signature and expiry validation
- Password hashing
- Expiring, single-use password-reset tokens
- Active-user validation
- Session revocation through token-version invalidation
- Explicit committee-level access control
- Role-based authorization
- Member-level ownership checks
- Audit logging
- Double-entry financial integrity checks
- Input validation
- Login abuse protection
- Security response headers
- Configurable CORS origins
- Dependency vulnerability scanning in CI

### Roles

- **Super Admin**: platform-level administration
- **Committee Admin**: administration within assigned committees
- **Member**: access limited to permitted member functionality and the member's own authorized resources

Committee membership and administrative privileges are represented explicitly through `UserCommitteeAccess`.

## Authorization and IDOR Protection

Resource access is enforced on the backend rather than relying on identifiers supplied by the client.

Authorization checks cover committee, member, member-good, asset, participation, contribution, dues, death-support, and settlement resources.

The implementation includes explicit committee access checks and ownership checks for member-scoped resources.

Authorization failures are separated from resource-level accounting errors so that permission failures can be returned as authorization responses while resource existence handling remains deliberate.

Regression tests cover unauthorized cross-member access, cross-committee access, role restrictions, and other authorization behavior.

Passing these tests does not prove that every possible authorization combination has been exhaustively tested.

## Financial Integrity

Financial operations use integer PKR values and a double-entry accounting model.

Journal entries must remain balanced. Financial corrections use non-destructive reversal behavior rather than silently changing historical transactions.

Domain validation also covers important financial chronology and consistency rules, including:

- Valuation dates cannot move backward
- Duplicate valuation dates for the same asset or member good are rejected
- Contribution-rate effective dates are unique within a committee
- Settlement and death-support dates follow the relevant lifecycle order
- Inactive members and inactive committees cannot receive new financial records where the domain rules prohibit them
- Settlement payments are checked against the expected settlement snapshot

Database constraints provide an additional integrity boundary where appropriate.

## Authentication and Session Security

Access tokens use signed JWTs with an expiry time and required claims.

The backend validates the token signature, expiry, subject, and token version. Logging out invalidates existing tokens by incrementing the user's token version.

Password-reset tokens are random, stored as hashes, expire, and are single-use.

Repeated failed login attempts are rate-limited by client IP within an in-memory window. This is appropriate for the current single-instance development architecture but should not be treated as sufficient distributed production rate limiting.

## Security Headers and CORS

The backend currently sends security response headers including:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

CORS origins are configuration-driven rather than hard-coded to a single frontend port.

The current development configuration is not a substitute for a production deployment security review.

## Dependency and Repository Security

The repository includes automated dependency checks for backend and frontend dependencies.

The project also uses GitHub Actions to run tests and security-related dependency checks.

Real `.env` files, local databases, build artifacts, Python caches, dependency directories, logs, backups, and temporary development artifacts are excluded from source control where appropriate.

## Known Limitations

This project is a portfolio/development application and is not presented as a production SaaS deployment.

Known limitations include:

- The current application uses SQLite for development and testing.
- The login rate limiter is in-memory and IP-based; a distributed production deployment would require shared or infrastructure-level rate limiting.
- Production deployment and infrastructure hardening are not yet implemented.
- SQLite backup and restore tooling is implemented and tested, but production backup storage, retention, and recovery infrastructure are not yet implemented.
- Frontend and end-to-end security testing is less extensive than backend security testing.
- Authorization testing is extensive but is not an exhaustive formal proof of every resource, role, and cross-committee combination.
- Automated dependency scanning detects known dependency issues but does not replace application-level security testing.
- The project has not been presented as a production security certification or guarantee.

Passing tests and scans do not guarantee that the application is free of security vulnerabilities.

## Development Security Practices

- Never commit real secrets or `.env` files.
- Use a strong random `SECRET_KEY` in real deployments.
- Keep production credentials outside source control.
- Test authorization at the backend API boundary.
- Treat client-supplied IDs as untrusted input.
- Add regression tests for security-sensitive changes.
- Preserve historical financial records rather than silently modifying them.
- Review database constraints and application validation together for important integrity rules.
