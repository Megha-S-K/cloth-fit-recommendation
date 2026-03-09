from sqlalchemy.orm import Session
from app.models.brand_size import BrandSize


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Maximum acceptable proportional deviation — used to normalise confidence.
# A deviation of 0.2 or more = 0% confidence (guaranteed wrong size).
DELTA_MAX = 0.2

# Garment types that use the chest/hip ratio (brand_r1) for matching.
# Everything else (bottoms) uses the waist/hip ratio (brand_r2).
TOP_GARMENT_TYPES = {"top", "full"}


def _get_return_risk(confidence: float) -> str:
    """Classify return risk from the fit confidence score."""
    if confidence >= 0.80:
        return "Low"
    if confidence >= 0.50:
        return "Medium"
    return "High"


def recommend_size(
    db: Session,
    brand: str,
    gender: str,
    garment_type: str,   # "top" | "bottom" | "full"
    category: str,
    product_type: str,
    user_r1: float,      # SW / HW  — user's shoulder-to-hip ratio
    user_r2: float,      # TL / LL  — user's torso-to-leg ratio
) -> dict:
    """
    Match the user's body proportions against brand size chart entries
    and return the best-fit size label with confidence and return risk.

    Matching strategy
    -----------------
    • Top / full garments  → match on brand_r1 (chest ÷ hip ratio)
    • Bottom garments      → match on brand_r2 (waist ÷ hip ratio)

    This is necessary because brand_r1 is NULL for all bottom entries
    in the database (bottoms have no chest measurement).

    Confidence formula (from SmartFit-AI formulation doc)
    -------------------------------------------------------
    Confidence = max(0,  1 − (Δ / Δ_max))

    where Δ is the absolute deviation between the user ratio and the
    matched brand ratio, and Δ_max = 0.2.
    """

    # ── 1. Fetch candidate rows ──────────────────────────────────────────────
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

    # ── 2. Choose which ratio to match on ────────────────────────────────────
    use_r1 = garment_type.lower() in TOP_GARMENT_TYPES
    user_ratio = user_r1 if use_r1 else user_r2

    # ── 3. Find the size with minimum deviation ──────────────────────────────
    best_row   = None
    best_delta = float("inf")

    for row in rows:
        # Select the appropriate brand ratio; skip row if it is NULL
        brand_ratio = row.brand_r1 if use_r1 else row.brand_r2

        if brand_ratio is None:
            continue

        delta = abs(user_ratio - brand_ratio)

        if delta < best_delta:
            best_delta = delta
            best_row   = row

    if best_row is None:
        return {
            "error": (
                f"All rows for this filter combination are missing the "
                f"required ratio column ({'brand_r1' if use_r1 else 'brand_r2'})."
            )
        }

    # ── 4. Compute confidence and return risk ─────────────────────────────────
    confidence  = round(max(0.0, 1.0 - (best_delta / DELTA_MAX)), 4)
    return_risk = _get_return_risk(confidence)

    # ── 5. Build response ────────────────────────────────────────────────────
    return {
        "recommended_size": best_row.size_label,
        "brand":            best_row.brand,
        "gender":           best_row.gender,
        "category":         best_row.category,
        "product_type":     best_row.product_type,
        "garment_type":     best_row.garment_type,
        "confidence":       confidence,
        "return_risk":      return_risk,
        "matched_on":       "brand_r1 (chest/hip)" if use_r1 else "brand_r2 (waist/hip)",
        "delta":            round(best_delta, 6),
    }