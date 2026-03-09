from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # --- Auth fields ---
    name  = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    # --- Raw measurements (normalized, unitless) ---
    sw = Column(Float)   # Shoulder Width
    hw = Column(Float)   # Hip Width
    tl = Column(Float)   # Torso Length
    ll = Column(Float)   # Leg Length

    # --- Derived ratios ---
    r1 = Column(Float)   # SW / HW  →  used for top matching
    r2 = Column(Float)   # TL / LL  →  secondary ratio

    # --- Classification ---
    body_shape             = Column(String)
    measurement_confidence = Column(Float)   # mean landmark visibility score