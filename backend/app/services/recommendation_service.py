from sqlalchemy.orm import Session
from app.models.brand_size import BrandSize


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Maximum acceptable deviation for normalising confidence.
# Delta >= DELTA_MAX gives 0% confidence.
DELTA_MAX = 0.2

# For bottom garments: weight between R1 (chest/hip) and R2 (torso/leg).
# R1 is more reliably extracted from photos so it carries more weight.
R1_WEIGHT = 0.65
R2_WEIGHT = 0.35


def _get_return_risk(confidence: float) -> str:
    if confidence >= 0.80:
        return "Low"
    if confidence >= 0.50:
        return "Medium"
    return "High"


def _match_rows(rows, user_r1: float, user_r2: float, use_r1_primary: bool):
    """
    Find the best-matching row.

    Tops / full  -> R1 only (chest/hip is the dominant fit driver).
    Bottoms      -> weighted dual-ratio (R1*0.65 + R2*0.35).
                Falls back to R1-only if brand_r2 is NULL for a row.
    """
    best_row   = None
    best_delta = float("inf")
    matched_on = ""

    for row in rows:
        if use_r1_primary:
            if row.brand_r1 is None:
                continue
            delta = abs(user_r1 - row.brand_r1)
            label = "brand_r1 (chest/hip)"
        else:
            r1_ok = row.brand_r1 is not None
            r2_ok = row.brand_r2 is not None

            if not r1_ok and not r2_ok:
                continue

            if r1_ok and r2_ok:
                d1    = abs(user_r1 - row.brand_r1)
                d2    = abs(user_r2 - row.brand_r2)
                delta = R1_WEIGHT * d1 + R2_WEIGHT * d2
                label = "R1 + R2 weighted"
            elif r1_ok:
                delta = abs(user_r1 - row.brand_r1)
                label = "brand_r1 (chest/hip)"
            else:
                delta = abs(user_r2 - row.brand_r2)
                label = "brand_r2 (torso/leg)"

        if delta < best_delta:
            best_delta = delta
            best_row   = row
            matched_on = label

    return best_row, best_delta, matched_on


def recommend_size(
    db: Session,
    brand: str,
    gender: str,
    garment_type: str,
    category: str,
    product_type: str,
    user_r1: float,
    user_r2: float,
) -> dict:
    """
    Match the user's body proportions against brand size chart entries
    and return the best-fit size label with confidence and return risk.

    Confidence = max(0, 1 - delta / 0.2)
    """

    rows = (
        db.query(BrandSize)
        .filter(BrandSize.brand        == brand)
        .filter(BrandSize.gender       == gender)
        .filter(BrandSize.garment_type == garment_type)
        .filter(BrandSize.category     == category)
        .filter(BrandSize.product_type == product_type)
        .all()
    )

    if not rows:
        return {
            "error": (
                f"No size data found for {brand} / {gender} / "
                f"{category} / {product_type} / {garment_type}"
            )
        }

    # Tops and full garments match on R1; bottoms use dual-ratio
    use_r1_primary = category.lower() in {"top", "full"}

    best_row, best_delta, matched_on = _match_rows(
        rows, user_r1, user_r2, use_r1_primary
    )

    if best_row is None:
        return {
            "error": "All rows for this combination are missing the required ratio columns."
        }

    confidence  = round(max(0.0, 1.0 - (best_delta / DELTA_MAX)), 4)
    return_risk = _get_return_risk(confidence)

    return {
        "recommended_size": best_row.size_label,
        "brand":            best_row.brand,
        "gender":           best_row.gender,
        "category":         best_row.category,
        "product_type":     best_row.product_type,
        "garment_type":     best_row.garment_type,
        "confidence":       confidence,
        "return_risk":      return_risk,
        "matched_on":       matched_on,
        "delta":            round(best_delta, 6),
    }