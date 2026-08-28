from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.1.8:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
