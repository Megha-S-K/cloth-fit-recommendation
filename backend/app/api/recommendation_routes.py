from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user_id

from app.models.user import User
from app.services.recommendation_service import recommend_size

router = APIRouter(prefix="/recommend", tags=["Recommendation"])


@router.post("/size")
def recommend(
    gender: str,
    brand: str,
    category: str,
    garment_type: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"error": "User not found"}

    result = recommend_size(
        db=db,
        brand=brand,
        gender=gender,
        category=category,
        garment_type=garment_type,
        user_r1=user.r1,
        user_r2=user.r2
    )

    return result