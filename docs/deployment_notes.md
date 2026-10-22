# Deployment notes

**Status: not deployed.** This is a guide plus a record of what was and was not tested.

## What was tested (Linux, no Docker available)
- The whole backend and ML suite (77 tests) passes on SQLite **and on PostgreSQL 16** (`TEST_DATABASE_URL=postgresql://... pytest`).
- A production-style run: frontend built with `VITE_API_URL=/api/v1`, one `uvicorn` process serving site and API on a Postgres database, with `--proxy-headers`. The home page and deep links (`/history/3`) return the app, hashed assets are cached for a year, API responses are `no-store`, unknown `/api/...` paths return JSON 404s, and a real cookie flow (register, explain, save, list, 401 without a cookie) wrote rows to Postgres.
- Path traversal out of the frontend folder is blocked (tested).

## What was NOT tested
- **The Dockerfile itself** was never built (Docker was not available). Expect to fix small things on the first build.
- Any hosting dashboard, HTTPS, or a real browser against a deployed site.
- Alembic migrations (there are none; tables are created with `create_all`).

## Why one service (important)
The login cookie is `SameSite=Lax`. A frontend and an API on two different default host names (for example two `*.onrender.com` sites) count as different sites, so the browser would not send the cookie and **login would silently fail**. The image therefore serves the website and the API from the same address.

## Steps (Render with Docker; other Docker hosts are similar)
1. **Push the code to GitHub** (see the README).
2. **The model files must be on the server.** `artifacts/` is gitignored, and the dataset must not be committed, so use a separate branch that includes only the small trained files:
   ```powershell
   git switch -c deploy
   git add -f artifacts/pipeline.joblib artifacts/model_card.json artifacts/metrics.json artifacts/feature_importance.json artifacts/data_summary.json artifacts/reference_profile.json
   git commit -m "Deploy: include trained model files"
   git push -u origin deploy
   git switch main
   ```
   Repeat after you retrain. The model must be trained with the same pinned library versions as the image (`backend/requirements.txt`), otherwise the app reports a version mismatch and refuses to predict.
3. **Create the service:** in Render choose New, then Web Service, connect the GitHub repository, set **Branch = deploy**, language/runtime **Docker**, and the Free instance type.
4. **Environment variables:** `APP_ENV=production` and `JWT_SECRET=<48+ random characters>` (`python -c "import secrets; print(secrets.token_urlsafe(48))"`). The server refuses to start in production with a missing or short secret.
5. Deploy, then open the service URL. Check `/api/v1/health` shows `"model_loaded":true`, then sign up and run an assessment.

## Data persistence
- Free Render web services have an **ephemeral filesystem**, and the default SQLite file is erased on every restart, redeploy and idle spin-down. Accounts and saved assessments disappear. Fine for a demo, not for anything else.
- To keep data, create a Render Postgres database and set `DATABASE_URL` on the web service to its internal URL. A `postgres://` or `postgresql://` URL works as given. Free Render databases reportedly expire after about 30 days, so check Render's current pricing page.
- Free web services sleep after 15 minutes without traffic and take about a minute to wake.

## Before this is more than a demo
1. **Alembic migrations** instead of `create_all`.
2. Shared rate-limit store, a Content-Security-Policy and HSTS, a request body limit at the proxy, backups, and error tracking that never records bodies.
3. Make the Open Graph image URL in `frontend/index.html` absolute.
4. A proper security review, clinical and regulatory input, and independent validation of the model.
5. **Do not put real patient data on a public deployment.** The app is an educational prototype. Consider a private repository and sharing the link only with people who know that.
