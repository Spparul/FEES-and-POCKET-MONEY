import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base
from routers import auth, students, fees, pocket_money, reports, settings, deficits, excesses, verification

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="School Fee & Pocket Money Management System",
    description="School-specific Student, Fee, Payment & Pocket Money Management application for 750 boys across 17 sections.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(fees.router)
app.include_router(pocket_money.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(deficits.router)
app.include_router(excesses.router)
app.include_router(verification.router)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
