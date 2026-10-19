# Run all tests and linters
.\.venv\Scripts\Activate.ps1
ruff check .
pytest
Push-Location frontend
npm run lint
npm test
Pop-Location
