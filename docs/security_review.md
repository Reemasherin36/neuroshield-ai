# Security review

Scope: this repository as built locally. It has **not** been deployed, load-tested, or penetration-tested by a third party. This review lists what was actually run and what was found.

## Automated checks that were run
| Check | Result |
|---|---|
| `pytest backend/tests/test_security.py` and the auth tests | Pass (see "Behaviour covered by tests") |
| `bandit -r backend/app ml` | 1 low-severity finding (B105, "hardcoded password"): a false positive, the placeholder `CHANGE_ME_...` that the production guard compares against. Annotated `# nosec B105` with a comment. No other findings |
| `pip-audit -r backend/requirements.txt` | No known vulnerabilities found |
| `npm audit --omit=dev` (code that ships to browsers) | **0 vulnerabilities**, after upgrading `react-router-dom` 6 to 7.18.4. Before the upgrade it reported 2 moderate advisories (an open redirect through backslashes in `<Link>`/`useNavigate`, and unsafe error deserialisation during SSR hydration) |
| `npm audit` (including dev tools) | 7 findings (2 moderate, 5 high), all in the **Tailwind CSS 3 build chain** (braces, micromatch, chokidar, fast-glob, postcss-selector-parser, postcss-nested): denial-of-service in pattern and selector parsing |
| Secrets scan of source, docs and scripts | Only a password literal inside a test fixture. No keys or tokens. `.env` is gitignored, `.env.example` holds placeholders |
| Logging scan | The backend code contains no logging or print calls |

### Accepted risk: Tailwind build-chain advisories
These affect only the build step on a developer machine, parse only this repository's own source files, and never ship to browsers. The fix is a move to Tailwind 4 (a major version with a different configuration model), which was not done here. Revisit when upgrading Tailwind. `npm audit fix --force` was deliberately not run.

## Behaviour covered by tests
Passwords hashed with Argon2, never returned, never truncated, minimum 10 characters. Generic login errors, with a dummy hash verified for unknown emails to even out timing. Failed-login limit (5 attempts per IP and email, 15 minutes). JWTs: tampered, wrongly signed, expired, `alg: none`, and tokens for deleted users are all rejected. Cookie is HttpOnly and SameSite=Lax, Secure in production, and cleared on logout. Authorization on every private route, with 404 (not 403) for other users' records, tested for read, delete and "delete all". Consent required to save. Strict input validation, with unknown fields rejected. Validation errors never echo submitted values. Unexpected server errors return a generic message. Security headers on every response. CORS limited to the configured frontend origin. Request body limit (413). The built frontend is served with a path-traversal guard (tested). The server refuses to start in production with a default or short `JWT_SECRET`, and API docs are disabled in production. Form-encoded and text bodies are rejected on state-changing endpoints.

## Known gaps and trade-offs (not fixed)
- **No CSRF token.** Protection relies on SameSite=Lax cookies, JSON-only bodies (a cross-site HTML form cannot send them), and a restricted CORS origin. Reasonable for this scope, but a deployment on a different registrable domain from the API needs a rethink.
- **Sessions cannot be revoked.** Tokens last 30 minutes, with no refresh token and no server-side session list. Changing a password does not invalidate tokens that were already issued.
- **Login rate limiting is in memory**, per process, and keyed on the client address the server sees. Behind a reverse proxy that address may be the proxy's. Use a shared store and trusted proxy headers when deploying.
- **Request size limit checks only the `Content-Length` header.** Chunked uploads without it are not capped by the application. Enforce a limit at the reverse proxy.
- **Account enumeration.** Registration returns 409 for an existing email. This is a common usability trade-off.
- **No email verification, password reset, MFA, or breached-password check.**
- **Proxy headers.** The container starts uvicorn with `--forwarded-allow-ips='*'` so the client address (for rate limiting) is read from `X-Forwarded-For`. That is only safe behind a host proxy that sets the header. Do not expose the container directly to the internet.
- **No Content-Security-Policy header.** The API returns JSON. Add a CSP on whatever serves the frontend.
- **SQLite is not encrypted at rest**, and the SQLite file is not wiped when rows are deleted.
- **Plain HTTP on localhost.** Any deployment must use HTTPS.
- **The dev default `JWT_SECRET` is a placeholder.** Only production mode enforces a strong one. Set a real one in `.env` even locally if the machine is shared.
