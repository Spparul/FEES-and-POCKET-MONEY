from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import students, pocket_money

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Canisius Secondary School - Boarder Pocket Money Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(pocket_money.router)

@app.get("/")
def read_root():
    return {"message": "Boarder Pocket Money Management API Running on Port 8001"}
