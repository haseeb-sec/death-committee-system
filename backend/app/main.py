from fastapi import FastAPI

from app.api.committee import router as committee_router
from app.api.contribution import router as contribution_router
from app.api.settlement import router as settlement_router
from app.api.death_support import router as death_support_router
from app.api.member_good import router as member_good_router
from app.api.member import router as member_router
from app.api.committee_asset import router as committee_asset_router
from app.api.member_due import router as member_due_router


app = FastAPI(
    title="Death Management Committee System",
    version="0.1.0",
)


app.include_router(committee_router)
app.include_router(contribution_router)
app.include_router(settlement_router)
app.include_router(death_support_router)
app.include_router(member_good_router)
app.include_router(member_router)


@app.get("/")
def root():
    return {
        "message": "Death Management Committee System API",
        "status": "running",
    }
app.include_router(committee_asset_router)
app.include_router(member_due_router)
