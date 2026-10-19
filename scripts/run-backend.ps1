# Start the API on http://127.0.0.1:8000
.\.venv\Scripts\Activate.ps1
Push-Location backend
uvicorn app.main:app --reload
Pop-Location
