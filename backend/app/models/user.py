from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

    sw = Column(Float)
    hw = Column(Float)
    tl = Column(Float)
    ll = Column(Float)

    r1 = Column(Float)
    r2 = Column(Float)

    body_shape = Column(String)
    measurement_confidence = Column(Float)