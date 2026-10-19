# Deployment notes

**The project has not been deployed.** These notes are a checklist for whoever does it, not a record of anything done.

## Before putting it on a server
1. **Secrets:** set `APP_ENV=production` and a long random `JWT_SECRET` (`python -c "import secrets; print(secrets.token_urlsafe(48))"`). The server refuses to start otherwise. Interactive API docs are switched off in production.
2. **HTTPS everywhere.** The cookie is marked Secure in production, so it will not work over plain HTTP.
3. **Origins:** set `FRONTEND_ORIGIN` to the real site address. Serve the frontend and API from the same registrable domain (for example `app.example.org` and `api.example.org`) so SameSite=Lax cookies work.
4. **Database:** move to PostgreSQL (`DATABASE_URL`). The models avoid SQLite-only features, but this has **not been tested** on PostgreSQL. Add **Alembic** migrations first: the app currently uses `create_all`, which does not handle schema changes.
5. **Model artifacts:** run `scripts\train.ps1` in an environment with the same pinned dependencies as the server. The backend returns 503 if the scikit-learn minor version differs from the one in `model_card.json`. Version and back up `artifacts/`, and keep the dataset hash (in the model card) with them.
6. **Rate limiting and sizes:** replace the in-memory login limiter with a shared store, configure trusted proxy headers, and enforce a request body limit at the proxy.
7. **Headers:** add a Content-Security-Policy and HSTS where the frontend is served.
8. **Frontend build:** `npm run build`, then serve `frontend/dist`. Set `VITE_API_URL` at build time. Make the Open Graph image URL absolute.
9. **Backups and retention:** decide how long accounts and saved assessments are kept, and write that into the privacy page.
10. **Monitoring:** add error tracking that never records request bodies or health data.

## Before calling it more than a student project
It would need a proper security review, clinical and regulatory input, and independent validation of the model. The app must keep presenting itself as educational unless and until those exist.
