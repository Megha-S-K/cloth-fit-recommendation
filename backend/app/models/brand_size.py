from sqlalchemy import Column, Integer, Float, String
from app.core.database import Base


class BrandSize(Base):

    __tablename__ = "brand_sizes"

    id = Column(Integer, primary_key=True, index=True)

    brand = Column(String)
    gender = Column(String)
    category = Column(String)
    product_type = Column(String)
    garment_type = Column(String)

    size_label = Column(String)

    upper_body_cm = Column(Float)
    waist_cm = Column(Float)
    hip_cm = Column(Float)
    neck_cm = Column(Float)
    inseam_cm = Column(Float)
    height_cm = Column(Float)

    brand_r1 = Column(Float)
    brand_r2 = Column(Float)
    brand_r3 = Column(Float)