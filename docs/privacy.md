# Privacy and data handling

## What is stored
| Data | When | Where |
|---|---|---|
| Email address | At registration | `users.email` |
| Password hash (Argon2) | At registration or password change | `users.password_hash` (the password is never stored) |
| Saved assessment: the ten inputs, score, threshold, band, model version, consent timestamp, created time | Only when you tick the consent box and choose "Save and get result" | `assessments` |

Nothing is stored for "Get result without saving". The frontend keeps that result only in memory. The breakdown of what drives a result (`POST /predictions/explain`) is also stateless: the server scores the answers and returns the result without storing them.

## What is not stored or sent
- No analytics, advertising, or third-party scripts, fonts, or images. The built frontend makes no requests to other hosts, and the backend makes none either.
- The only cookie is the HttpOnly login cookie (`access_token`).
- The backend code contains no logging calls, so it never writes request bodies or health data to logs. Validation errors list field names and messages only and never echo submitted values. No health data is placed in URLs or query strings (assessment ids and pagination numbers only).
- The web server's own access log (uvicorn) records method, path, status and client address, never bodies.

## Retention and deletion
- Data stays until you delete it. You can delete one assessment, all assessments, or your account (password required). Deleting the account also deletes its assessments.
- Deleted rows are removed from the database. The SQLite file is not wiped or overwritten, and backups made by you are outside the app's control.

## Limits you should know about
- The local database is **not encrypted at rest** and this prototype is **not production-grade**. Do not enter real patient data.
- Connections run over plain HTTP on localhost during development. Any deployment needs HTTPS.
- This project makes no claim of compliance with any healthcare privacy law or regulation.
