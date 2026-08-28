from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, students, fees, pocket_money, reports, settings, deficits, excesses, verification

# Create database tables
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

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "School Fee & Pocket Money Management System",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
