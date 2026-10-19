# One-time setup. Run from the project root:  .\scripts\setup.ps1
if (-not (Test-Path .venv)) { python -m venv .venv }
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements-dev.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
Push-Location frontend
npm install
Pop-Location
Write-Host "Setup finished. Next: place the Kaggle CSV in data\ and run .\scripts\train.ps1"
