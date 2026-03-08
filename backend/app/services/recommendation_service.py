from sqlalchemy.orm import Session
from app.models.brand_size import BrandSize


def recommend_size(
    db: Session,
    brand: str,
    gender: str,
    garment_type: str,
    category: str,
    product_type: str,
    user_r1: float,
    user_r2: float
):

    rows = (
        db.query(BrandSize)
        .filter(BrandSize.brand == brand)
        .filter(BrandSize.gender == gender)
        .filter(BrandSize.garment_type == garment_type)
        .filter(BrandSize.category == category)
        .filter(BrandSize.product_type == product_type)
        .all()
    )

    if not rows:
        return {"error": "No size data available"}

    best_row = None
    best_score = float("inf")

    for row in rows:

        score = (
            0.5 * abs(user_r1 - row.brand_r1)
            + 0.3 * abs(user_r2 - row.brand_r2)
        )

        if score < best_score:
            best_score = score
            best_row = row

    confidence = max(0, 1 - best_score)

    return {
        "recommended_size": best_row.size_label,
        "confidence": round(confidence, 2),
        "score": best_score
    }