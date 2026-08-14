from fastapi import FastAPI

app = FastAPI(
    title="Death Management Committee System",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "Death Management Committee System API",
        "status": "running",
    }