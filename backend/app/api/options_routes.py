from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.core.database import get_db
from app.models.brand_size import BrandSize

router = APIRouter(prefix="/options", tags=["Options"])


# ── 1. Genders ────────────────────────────────────────────────────────────────

@router.get("/genders")
def get_genders(db: Session = Depends(get_db)):
    """Step 1 — Return all distinct genders available in the size chart."""
    rows = db.query(distinct(BrandSize.gender)).order_by(BrandSize.gender).all()
    return [r[0] for r in rows]


# ── 2. Brands ─────────────────────────────────────────────────────────────────

@router.get("/brands")
def get_brands(
    gender: str,
    db: Session = Depends(get_db),
):
    """Step 2 — Brands that have data for the selected gender."""
    rows = (
        db.query(distinct(BrandSize.brand))
        .filter(BrandSize.gender == gender)
        .order_by(BrandSize.brand)
        .all()
    )
    return [r[0] for r in rows]


# ── 3. Categories ─────────────────────────────────────────────────────────────

@router.get("/categories")
def get_categories(
    gender: str,
    brand:  str,
    db: Session = Depends(get_db),
):
    """Step 3 — Categories available for the selected gender + brand."""
    rows = (
        db.query(distinct(BrandSize.category))
        .filter(BrandSize.gender == gender)
        .filter(BrandSize.brand  == brand)
        .order_by(BrandSize.category)
        .all()
    )
    return [r[0] for r in rows]


# ── 4. Product types  ← THIS WAS MISSING ─────────────────────────────────────

@router.get("/product-types")
def get_product_types(
    gender:   str,
    brand:    str,
    category: str,
    db: Session = Depends(get_db),
):
    """
    Step 4 — Product types for the selected gender + brand + category.

    Examples: regular, petite, tall, plus, short
    This step was previously missing from the cascade entirely.
    """
    rows = (
        db.query(distinct(BrandSize.product_type))
        .filter(BrandSize.gender   == gender)
        .filter(BrandSize.brand    == brand)
        .filter(BrandSize.category == category)
        .order_by(BrandSize.product_type)
        .all()
    )
    return [r[0] for r in rows]


# ── 5. Garment types ──────────────────────────────────────────────────────────

@router.get("/garment-types")
def get_garment_types(
    gender:       str,
    brand:        str,
    category:     str,
    product_type: str,
    db: Session = Depends(get_db),
):
    """
    Step 5 — Garment types for the full filter chain.

    Values will be one of:  top | bottom | full
    This drives which ratio (brand_r1 vs brand_r2) the recommendation
    service uses for size matching.
    """
    rows = (
        db.query(distinct(BrandSize.garment_type))
        .filter(BrandSize.gender       == gender)
        .filter(BrandSize.brand        == brand)
        .filter(BrandSize.category     == category)
        .filter(BrandSize.product_type == product_type)
        .order_by(BrandSize.garment_type)
        .all()
    )
    return [r[0] for r in rows]