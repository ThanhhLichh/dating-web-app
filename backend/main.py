from fastapi import FastAPI
from database import Base, engine
from routers import user_router
from auth import auth_router

app = FastAPI(title="LoveConnect API ❤️")

Base.metadata.create_all(bind=engine)

# Routers
app.include_router(user_router.router)
app.include_router(auth_router.router)

@app.get("/")
def home():
    return {"message": "Welcome to LoveConnect API"}
