from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.models.user import User
from app.services.recommendation_service import recommend_size

router = APIRouter(prefix="/recommend", tags=["Recommendation"])


# ── Request schema ────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    gender:       str   # e.g. "Women"
    brand:        str   # e.g. "Adidas"
    category:     str   # e.g. "top"
    product_type: str   # e.g. "regular"  ← was missing before
    garment_type: str   # e.g. "top" | "bottom" | "full"


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/size")
def recommend(
    body:    RecommendRequest = ...,
    db:      Session          = Depends(get_db),
    user_id: int              = Depends(get_current_user_id),
):
    """
    Return the best-fit size label for the authenticated user.

    The user's R1 / R2 ratios (stored at registration) are matched
    against the brand size chart using the deviation-minimisation rule:

        Recommended_Size = argmin | user_ratio − brand_ratio_i |

    For top / full garments  → matches on brand_r1  (chest / hip)
    For bottom garments      → matches on brand_r2  (waist / hip)
    """

    # ── 1. Load user ratios from DB ───────────────────────────────────────────
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.r1 is None or user.r2 is None:
        raise HTTPException(
            status_code=400,
            detail="User measurements not found. Please re-register with a valid image.",
        )

    # ── 2. Run recommendation ─────────────────────────────────────────────────
    result = recommend_size(
        db           = db,
        brand        = body.brand,
        gender       = body.gender,
        garment_type = body.garment_type,
        category     = body.category,
        product_type = body.product_type,
        user_r1      = user.r1,
        user_r2      = user.r2,
    )

    # ── 3. Propagate service-level errors as HTTP 404 ─────────────────────────
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result