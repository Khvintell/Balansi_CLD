import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from db.database import engine, Base
from api.routers import router as api_router

# Create DB tables
Base.metadata.create_all(bind=engine)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

app = FastAPI(title="Balansi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

app.include_router(api_router)

@app.get("/test-bio")
def test_bio():
    return {"status": "ok", "message": "Biometrics router should be working"}

@app.get("/")
def read_root():
    return {"message": "Balansi API წარმატებით მუშაობს! 🚀", "status": "online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)