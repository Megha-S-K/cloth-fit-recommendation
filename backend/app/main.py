from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.api.auth_routes           import router as auth_router
from app.api.options_routes        import router as options_router
from app.api.recommendation_routes import router as recommendation_router
from app.api.debug_routes          import router as debug_router   # ← TEMP

# ── Create all tables (runs on startup) ───────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "SmartFit-AI API",
    description = "AI-based clothing size recommendation system",
    version     = "1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allows the React frontend (running on port 5173 by default with Vite,
# or 3000 with CRA) to call this API during development.
# In production replace the origins list with your actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(options_router)
app.include_router(recommendation_router)
app.include_router(debug_router)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "SmartFit-AI backend is running"}