from fastapi import FastAPI
from app.api.auth_routes import router as auth_router
from app.api.options_routes import router as options_router
from app.core.database import Base, engine
from app.api.recommendation_routes import router as recommendation_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(recommendation_router)
app.include_router(options_router)