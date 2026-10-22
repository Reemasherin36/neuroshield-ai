"""Serve the built React app from the API so the site and the API share one origin.

One origin means the SameSite login cookie works with no CORS setup. Deep links such as /history/3 return
index.html so the client-side router can take over. Unknown /api/... paths stay JSON 404s."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.errors import ApiError

IMMUTABLE = "public, max-age=31536000, immutable"  # /assets files have content hashes in their names


class HashedAssets(StaticFiles):
    """StaticFiles that marks successful responses as cacheable forever (safe: the file name changes when content does)."""

    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = IMMUTABLE
        return response


def mount_frontend(app: FastAPI, dist: Path) -> None:
    dist = dist.resolve()
    index = dist / "index.html"
    if not index.is_file():
        raise RuntimeError(f"FRONTEND_DIST is set but {index} does not exist. Run `npm run build` in frontend/ first.")
    app.mount("/assets", HashedAssets(directory=dist / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise ApiError(404, "http_error", "Not Found")
        candidate = (dist / full_path).resolve()
        if full_path and candidate.is_file() and dist in candidate.parents:  # never serve outside dist
            return FileResponse(candidate)
        return FileResponse(index, headers={"Cache-Control": "no-cache"})
