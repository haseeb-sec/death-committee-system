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
- Password hashing
- Expiring password-reset tokens
- Active-user validation
- Session revocation through token-version invalidation
- Explicit committee-level access control
- Role-based authorization
- Member-level authorization
- Audit logging
- Double-entry financial integrity checks

### Roles

- **Super Admin**: platform-level administration
- **Committee Admin**: administration within assigned committees
- **Member**: access limited to permitted member functionality and their own member record

Committee membership and administrative privileges are represented explicitly through `UserCommitteeAccess`.

## Authorization and IDOR Protection

Resource access is enforced on the backend rather than relying on identifiers supplied by the client.

Authorization checks cover committee, member, member-good, asset, participation, contribution, dues, and settlement resources.

The project also includes regression tests for unauthorized cross-member access and authorization behavior.

## Financial Integrity

Financial operations use integer PKR values and a double-entry accounting model.

Journal entries must remain balanced. Financial corrections use non-destructive reversal behavior rather than silently changing historical transactions.

## Known Limitations

This project is a portfolio/development application and is not presented as a production SaaS deployment.

Known limitations include:

- Authorization coverage is tested extensively but is not an exhaustive formal matrix for every resource, role, and cross-committee combination.
- The application currently uses SQLite for its development/test environment.
- Production deployment, infrastructure hardening, rate limiting, observability, and backup/recovery procedures are not yet fully implemented.
- Frontend and end-to-end security testing is limited compared with the backend test coverage.
- Security scanning and additional automated security checks remain part of the project roadmap.

Passing tests do not guarantee that the application is free of security vulnerabilities.

## Development Security Practices

- Never commit real secrets or `.env` files.
- Use a strong random `SECRET_KEY` in real deployments.
- Keep production credentials outside source control.
- Test authorization at the backend API boundary.
- Treat client-supplied IDs as untrusted input.
- Review security-sensitive changes with regression tests.
