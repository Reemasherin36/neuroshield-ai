from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import models  # noqa: F401  (registers tables)
from app.core.config import settings
from app.core.errors import ApiError
from app.db.session import Base, engine
from app.routers import assessments, auth, health, model, predictions, users
from app.services.model_service import model_service

MAX_BODY_BYTES = 32_768
# Placeholder that the production guard compares against. It is not a credential.
DEFAULT_SECRET = "CHANGE_ME_TO_A_LONG_RANDOM_STRING"  # nosec B105


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.app_env == "production" and (settings.jwt_secret == DEFAULT_SECRET or len(settings.jwt_secret) < 32):
        raise RuntimeError("Set a strong JWT_SECRET (32+ chars) in .env before running in production.")
    Base.metadata.create_all(bind=engine)  # dev only; Alembic comes later
    model_service.load()
    yield


_prod = settings.app_env == "production"
app = FastAPI(
    title="NeuroShield AI API", version="1.0.0", lifespan=lifespan,
    docs_url=None if _prod else "/docs", redoc_url=None, openapi_url=None if _prod else "/openapi.json",
)  # interactive docs are disabled in production

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


def _err(status: int, code: str, message: str, details=None):
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message, "details": details}})


@app.middleware("http")
async def limits_and_headers(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        return _err(413, "payload_too_large", "Request body is too large.")
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(ApiError)
async def api_exc(_: Request, exc: ApiError):
    return _err(exc.status, exc.code, exc.message, exc.details)


@app.exception_handler(StarletteHTTPException)
async def http_exc(_: Request, exc: StarletteHTTPException):
    return _err(exc.status_code, "http_error", str(exc.detail))


@app.exception_handler(RequestValidationError)
async def validation_exc(_: Request, exc: RequestValidationError):
    # Report field locations and messages only, never the submitted values.
    details = [{"field": ".".join(str(p) for p in e["loc"]), "message": e["msg"]} for e in exc.errors()]
    return _err(422, "validation_error", "Invalid input.", details)


for r in (health.router, auth.router, users.router, predictions.router, assessments.router, model.router):
    app.include_router(r, prefix="/api/v1")
