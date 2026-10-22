"""Single-origin frontend serving, tested on a small throwaway app so it cannot disturb the real routes."""
import pytest
from app.core.errors import ApiError
from app.core.spa import mount_frontend
from fastapi import FastAPI
from fastapi.testclient import TestClient


@pytest.fixture()
def site(tmp_path):
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app-abc123.js").write_text("console.log('hi')")
    (tmp_path / "index.html").write_text("<html><body>INDEX</body></html>")
    (tmp_path / "robots.txt").write_text("User-agent: *")
    secret = tmp_path.parent / "outside-secret.txt"
    secret.write_text("TOP SECRET")
    app = FastAPI()

    @app.exception_handler(ApiError)
    async def _h(_, exc: ApiError):
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=exc.status, content={"error": {"code": exc.code, "message": exc.message}})

    @app.get("/api/v1/ping")
    def ping():
        return {"ok": True}

    mount_frontend(app, tmp_path)
    return TestClient(app)


def test_root_and_deep_links_return_the_app(site):
    for path in ("/", "/history/3", "/analytics", "/some/unknown/page"):
        r = site.get(path)
        assert r.status_code == 200 and "INDEX" in r.text, path
        assert r.headers["cache-control"] == "no-cache"


def test_hashed_assets_are_served_and_cacheable(site):
    r = site.get("/assets/app-abc123.js")
    assert r.status_code == 200 and "console.log" in r.text
    assert "immutable" in r.headers["cache-control"]


def test_static_files_in_the_dist_root_are_served(site):
    assert site.get("/robots.txt").text == "User-agent: *"


def test_api_routes_still_win_and_unknown_api_paths_are_json_404s(site):
    assert site.get("/api/v1/ping").json() == {"ok": True}
    r = site.get("/api/v1/does-not-exist")
    assert r.status_code == 404 and r.headers["content-type"].startswith("application/json")
    assert "INDEX" not in r.text


TRAVERSAL = [
    "/../outside-secret.txt",
    "/%2e%2e/outside-secret.txt",
    "/..%2foutside-secret.txt",
    "/assets/../../outside-secret.txt",
]


@pytest.mark.parametrize("path", TRAVERSAL)
def test_path_traversal_cannot_leave_the_dist_folder(site, path):
    r = site.get(path)
    assert "TOP SECRET" not in r.text


def test_missing_build_fails_loudly(tmp_path):
    with pytest.raises(RuntimeError, match="npm run build"):
        mount_frontend(FastAPI(), tmp_path / "nope")


def test_database_url_is_normalised_for_psycopg():
    from app.core.config import Settings

    for given in ("postgres://u:p@h:5432/db", "postgresql://u:p@h:5432/db"):
        assert Settings(database_url=given).database_url == "postgresql+psycopg://u:p@h:5432/db"
    assert Settings(database_url="sqlite:///x.db").database_url == "sqlite:///x.db"
    assert Settings(database_url="postgresql+psycopg://u:p@h/db").database_url == "postgresql+psycopg://u:p@h/db"
