from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.core.security import hash_password, create_access_token

from app.services.image_preprocess_service import preprocess_image
from app.services.pose_service import extract_pose_landmarks
from app.services.measurement_service import extract_measurements
from app.services.body_shape_service import compute_ratios, classify_body_shape

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(
    email: str = Form(...),
    password: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # read uploaded image
    file_bytes = await image.read()

    # preprocessing
    processed_image = preprocess_image(file_bytes)

    # pose detection
    landmarks = extract_pose_landmarks(processed_image)

    if landmarks is None:
        raise HTTPException(status_code=400, detail="Pose detection failed")

    # measurement extraction
    SW, HW, TL, LL = extract_measurements(landmarks)

    # compute ratios
    R1, R2 = compute_ratios(SW, HW, TL, LL)

    # classify body shape
    body_shape = classify_body_shape(R1, R2)

    # create user
    new_user = User(
        email=email,
        password_hash=hash_password(password),

        sw=SW,
        hw=HW,
        tl=TL,
        ll=LL,

        r1=R1,
        r2=R2,

        body_shape=body_shape,
        measurement_confidence=1.0
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"user_id": new_user.id})

    return {
        "message": "Registration successful",
        "body_shape": body_shape,
        "token": token
    }