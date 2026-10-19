# NeuroShield AI

An **educational, research-only** stroke risk exploration web app: a React frontend, a FastAPI backend, a SQLite database and a scikit-learn model trained on a public Kaggle dataset.

> **Educational prototype, not medical advice.** It cannot diagnose a stroke or rule one out. If you suspect a stroke (face drooping, arm weakness, speech difficulty, sudden severe headache or vision loss), call your local emergency number immediately.

**Status:** all six build phases are complete. It has been tested on Linux only. **It has not been run on Windows or in a real browser**, so please follow [docs/qa_checklist.md](docs/qa_checklist.md) after your first run.

## What you get
Landing page, sign in / register, dashboard, new assessment (with consent to save, or "get result without saving"), result page, history, analytics (real metrics from your own training run), settings (password change, delete data, delete account), methodology page and a 404 page.

---

## Setup on Windows 10/11 (PowerShell), step by step

### 1. Install the tools (once)
1. **Python 3.12** from https://www.python.org/downloads/. On the first installer screen tick **"Add python.exe to PATH"**. (3.11 may work; the pinned versions were installed on 3.12.)
2. **Node.js LTS** from https://nodejs.org/.
3. **Git** from https://git-scm.com/ (optional unless you clone with it).
4. **VS Code** from https://code.visualstudio.com/, with the extensions *Python*, *ESLint*, *Prettier* and *Tailwind CSS IntelliSense*.

Check in a new PowerShell window:
```powershell
python --version    # expect: Python 3.12.x
node --version      # expect: v20.x or newer
npm --version
```

### 2. Open the project
Unzip it, then in VS Code choose **File > Open Folder** and pick the `neuroshield-ai` folder. Open a terminal with **Terminal > New Terminal** (PowerShell). All commands below run from this folder unless stated.

### 3. Create and activate the Python environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
If PowerShell says *"running scripts is disabled on this system"*, allow scripts **for this window only** and retry:
```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\.venv\Scripts\Activate.ps1
```
You should now see `(.venv)` at the start of the prompt.

### 4. Install dependencies
```powershell
pip install -r backend\requirements-dev.txt
copy .env.example .env
cd frontend
npm install
cd ..
```
Open `.env` and replace `JWT_SECRET` with a long random value:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```
(Or run `.\scripts\setup.ps1`, which does the install steps for you. Still edit `.env`.)

### 5. Get the dataset (manual, it needs a Kaggle login)
1. Open https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset and sign in.
2. Click **Download**, unzip, and copy `healthcare-dataset-stroke-data.csv` into the project's `data\` folder.

The app never downloads or scrapes data itself. Without the CSV, training stops with a friendly "setup required" message.

### 6. Train and evaluate the model
```powershell
.\scripts\train.ps1
```
This runs, in order: data checks and EDA (`docs\eda.md`), model training and selection, a one-time evaluation on the held-out test set, the generated `docs\model_selection.md`, and a dataset summary. Expected output ends with lines like:
```
selected=hist_gradient_boosting threshold=0.0674 val_precision=0.125 val_recall=0.820
{'recall': 0.82, 'precision': 0.1239, ... 'roc_auc': 0.8226, 'pr_auc': 0.2358, ...}
```
Your numbers should be very close to these but are not guaranteed to be identical on a different machine. **Your own run is the one the app will show.** Artifacts go to `artifacts\`.

### 7. Start the app (two terminals)
Terminal 1, the backend (leave it running):
```powershell
.\scripts\run-backend.ps1
```
Expect `Uvicorn running on http://127.0.0.1:8000`. Check http://127.0.0.1:8000/api/v1/health: it should show `"model_loaded":true`.

Terminal 2, the frontend (open a **new** terminal; no need to activate the venv):
```powershell
.\scripts\run-frontend.ps1
```
Expect `Local: http://localhost:5173/`.

### 8. Use it
Open **http://localhost:5173** in your browser, create an account, and try an assessment. Interactive API docs: http://127.0.0.1:8000/docs.

### 9. Run the tests and linters
```powershell
.\scripts\test.ps1
```
or individually:
```powershell
ruff check .                  # Python lint
pytest                        # backend + ML tests
cd frontend; npm run lint; npm test; cd ..
python scripts\contrast_check.py   # colour contrast audit
```
Reference results from the development run: `pytest` (backend + ML) 60 passed, frontend `npm test` 62 passed, contrast audit 40/40 pairs pass. Tests that need a trained model are skipped (not faked) if `artifacts\` is empty.

### 10. Troubleshooting
| Problem | Fix |
|---|---|
| `Activate.ps1 cannot be loaded ... running scripts is disabled` | `Set-ExecutionPolicy -Scope Process Bypass`, then activate again |
| `python` is not recognised | Reinstall Python with **Add to PATH** ticked, or use `py -3.12` instead of `python`. Open a new terminal afterwards |
| Wrong Python version / `No matching distribution found` for numpy, pandas or scikit-learn | Use Python 3.12 (`py -3.12 -m venv .venv`). Delete `.venv` first if it was created with another version |
| `ModuleNotFoundError` | The venv is not active (no `(.venv)` in the prompt) or step 4 was skipped. Activate it and run `pip install -r backend\requirements-dev.txt` |
| `Address already in use` / port 8000 or 5173 busy | Find it with `netstat -ano \| findstr :8000`, then `taskkill /PID <number> /F`. Or close the old terminal. The frontend needs port 5173 exactly |
| Browser console shows a **CORS error** or sign-in does nothing | Open the app at `http://localhost:5173` (not `127.0.0.1`), keep the backend running, and make sure `FRONTEND_ORIGIN` in `.env` is `http://localhost:5173`. Restart the backend after editing `.env` |
| App says **"Model not trained yet"** / health shows `model_loaded:false` | Put the CSV in `data\`, run `.\scripts\train.ps1`, then **restart the backend** |
| Health message says the model was trained with a different scikit-learn version | Run `.\scripts\train.ps1` again in this environment |
| `SETUP REQUIRED: No CSV found in data/` | The file is missing or not in `data\` (not a subfolder) |
| `npm install` fails | Use Node LTS. Delete `frontend\node_modules`, run `npm cache clean --force`, retry. On a corporate network check the npm proxy settings |
| Sign-in works but you are logged out after 30 minutes | By design: sessions are short and have no refresh token |
| Signed out right after logging in on a deployed site | The cookie is Secure in production, so it needs HTTPS. See `docs\deployment_notes.md` |

## Project documentation
[architecture](docs/architecture.md) · [API reference](docs/api.md) · [EDA](docs/eda.md) · [model selection](docs/model_selection.md) · [methodology](docs/methodology.md) · [limitations](docs/limitations.md) · [privacy](docs/privacy.md) · [security review](docs/security_review.md) · [accessibility](docs/accessibility.md) · [manual QA checklist](docs/qa_checklist.md) · [assets](docs/assets.md) · [deployment notes](docs/deployment_notes.md)

## Honest summary of limits
The dataset has few stroke cases and unclear origin, the model's precision is low, and nothing here is clinically validated. The database is not encrypted at rest. Read [docs/limitations.md](docs/limitations.md) and [docs/security_review.md](docs/security_review.md) before showing this to anyone.
