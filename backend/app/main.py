from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.committee import router as committee_router
from app.api.contribution import router as contribution_router
from app.api.settlement import router as settlement_router
from app.api.death_support import router as death_support_router
from app.api.member_good import router as member_good_router
from app.api.member import router as member_router
from app.api.committee_asset import router as committee_asset_router
from app.api.member_due import router as member_due_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.audit import router as audit_router


app = FastAPI(
    title="Death Management Committee System",
    version="0.1.0",
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response


cors_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)


# ============================================================
# API ROUTER REGISTRATION
# ============================================================
#
# IMPORTANT:
# Keep these registrations at module level.
# Do not put them inside functions, conditionals, or startup
# callbacks. FastAPI needs these routers during application
# construction so OpenAPI and TestClient can discover them.
# ============================================================

app.include_router(committee_router)
app.include_router(contribution_router)
app.include_router(settlement_router)
app.include_router(death_support_router)
app.include_router(member_good_router)
app.include_router(member_router)
app.include_router(committee_asset_router)
app.include_router(member_due_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(audit_router)


@app.get("/")
def root():
    return {
        "message": "Death Management Committee System API",
        "status": "running",
    }
