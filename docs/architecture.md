# Architecture

```
Browser (React 18 + TypeScript + Vite)            FastAPI backend (Python)                 Offline ML (ml/)
 pages, forms (Zod), typed API client  --JSON-->  routers -> services -> SQLAlchemy  <--    prepare_data -> train
 HttpOnly cookie sent automatically    <--JSON--  model_service (loads artifacts once)       -> evaluate -> report
                                                       |                                         |
                                                  SQLite (users, assessments)            artifacts/ (pipeline.joblib,
                                                                                          metrics.json, model_card.json, ...)
```

## Layout
| Folder | Purpose |
|---|---|
| `frontend/` | React app. `src/pages`, `src/components`, `src/lib` (API client, auth, schemas). Brand files in `public/brand/`. |
| `backend/app/` | `routers/` (HTTP), `schemas/` (Pydantic), `models/` (SQLAlchemy), `services/` (model loading, prediction), `core/` (config, security, errors, deps), `db/`. |
| `ml/` | Offline pipeline: `prepare_data.py`, `train.py`, `evaluate.py`, `predict.py`, `report.py`, `summarize.py`, `config.py`. |
| `artifacts/` | Output of training (gitignored). The backend refuses to predict without them. |
| `data/` | The Kaggle CSV (gitignored, placed manually). |
| `scripts/` | PowerShell helpers, the contrast audit, and the API-doc generator. |

## Key decisions
- **One source of truth for predictions.** Both `/predictions` and `/assessments` call the same saved scikit-learn pipeline through `ml.predict`. Nothing is hard-coded or randomised.
- **Fail safe.** If artifacts are missing, were trained with a different scikit-learn minor version, or cannot be loaded, the model endpoints return 503 with a plain message and the UI shows a "model not trained yet" state.
- **Stateless prediction is really stateless.** `/predictions` stores nothing. The frontend passes the result to the result page through router state, so an unsaved result lives only in memory and is lost on refresh.
- **Auth.** Argon2 password hashes. A 30-minute JWT in an HttpOnly, SameSite=Lax cookie (Secure when `APP_ENV=production`). There is no refresh token, so a session simply expires. Authorization is enforced on the server for every private route, and another user's record returns 404.
- **Database.** SQLAlchemy 2 models use no SQLite-only features, so they should port to PostgreSQL. Tables are created with `create_all` at startup for development. Alembic migrations are **not** set up; add them before any real deployment.
- **Frontend loading.** Chart-heavy pages (Dashboard, Analytics) are lazy-loaded so the landing page stays small.
- **Training discipline.** Stratified 60/20/20 split with a fixed seed; preprocessing fitted on training data only; class imbalance handled with class weights inside training; calibration fitted by cross-validation on training data; the decision threshold chosen on validation; the test set evaluated once.
