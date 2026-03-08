from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.core.database import get_db
from app.models.brand_size import BrandSize

router = APIRouter(prefix="/options", tags=["Options"])


# 1️⃣ Get available genders
@router.get("/genders")
def get_genders(db: Session = Depends(get_db)):

    genders = db.query(distinct(BrandSize.gender)).all()

    return [g[0] for g in genders]


# 2️⃣ Get brands based on gender
@router.get("/brands")
def get_brands(gender: str, db: Session = Depends(get_db)):

    brands = (
        db.query(distinct(BrandSize.brand))
        .filter(BrandSize.gender == gender)
        .all()
    )

    return [b[0] for b in brands]


# 3️⃣ Get categories
@router.get("/categories")
def get_categories(gender: str, brand: str, db: Session = Depends(get_db)):

    categories = (
        db.query(distinct(BrandSize.category))
        .filter(BrandSize.gender == gender)
        .filter(BrandSize.brand == brand)
        .all()
    )

    return [c[0] for c in categories]


# 4️⃣ Get garment types
@router.get("/garments")
def get_garments(
    gender: str,
    brand: str,
    category: str,
    db: Session = Depends(get_db),
):

    garments = (
        db.query(distinct(BrandSize.garment_type))
        .filter(BrandSize.gender == gender)
        .filter(BrandSize.brand == brand)
        .filter(BrandSize.category == category)
        .all()
    )

    return [g[0] for g in garments]