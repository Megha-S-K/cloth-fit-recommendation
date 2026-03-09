from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token

from app.services.image_preprocess_service import preprocess_image
from app.services.pose_service import extract_pose_landmarks
from app.services.measurement_service import (
    extract_measurements,
    compute_measurement_confidence,
    validate_ratios,
)
from app.services.body_shape_service import compute_ratios, classify_body_shape

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Shared image processing pipeline ─────────────────────────────────────────

async def _process_image(file_bytes: bytes):
    """
    Run the full image → landmarks → measurements → ratios pipeline.
    Raises HTTPException with clear photo guidelines if anything fails.
    Returns (SW, HW, TL, LL, R1, R2, body_shape, measurement_confidence).
    """

    # Preprocess
    processed_image = preprocess_image(file_bytes)

    # Pose detection
    landmarks = extract_pose_landmarks(processed_image)
    if landmarks is None:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Pose detection failed — no body landmarks found.",
                "guidelines": (
                    "Please upload a photo that meets these requirements:\n"
                    "  • Full body visible from head to feet\n"
                    "  • Standing straight, facing the camera directly\n"
                    "  • Arms relaxed at sides\n"
                    "  • Fitted clothing and plain background\n"
                    "  • Good lighting\n"
                    "  • At least 1.5–2 metres from the camera"
                ),
            },
        )

    # Measurements
    SW, HW, TL, LL = extract_measurements(landmarks)
    measurement_confidence = compute_measurement_confidence(landmarks)

    # Ratios
    R1, R2 = compute_ratios(SW, HW, TL, LL)

    # ── Validation — reject anatomically impossible values ────────────────────
    validation_error = validate_ratios(R1, R2)
    if validation_error:
        raise HTTPException(status_code=422, detail=validation_error)

    # Body shape classification
    body_shape = classify_body_shape(R1, R2)

    return SW, HW, TL, LL, R1, R2, body_shape, measurement_confidence


# ── REGISTER ──────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(
    name:     str        = Form(...),
    email:    str        = Form(...),
    password: str        = Form(...),
    image:    UploadFile = File(...),
    db:       Session    = Depends(get_db),
):
    """
    Register a new user.

    The uploaded body image is processed to extract measurements.
    Image is permanently deleted after landmark extraction.
    Returns JWT token on success.
    """

    # 1. Duplicate email check
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Process image
    file_bytes = await image.read()
    SW, HW, TL, LL, R1, R2, body_shape, measurement_confidence = (
        await _process_image(file_bytes)
    )

    # 3. Persist user
    new_user = User(
        name                   = name,
        email                  = email,
        password_hash          = hash_password(password),
        sw                     = SW,
        hw                     = HW,
        tl                     = TL,
        ll                     = LL,
        r1                     = R1,
        r2                     = R2,
        body_shape             = body_shape,
        measurement_confidence = measurement_confidence,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Issue JWT
    token = create_access_token({"user_id": new_user.id})

    return {
        "message": "Registration successful",
        "token":   token,
        "user": {
            "id":                     new_user.id,
            "name":                   new_user.name,
            "email":                  new_user.email,
            "body_shape":             new_user.body_shape,
            "measurement_confidence": new_user.measurement_confidence,
            "r1":                     new_user.r1,
            "r2":                     new_user.r2,
        },
    }


# ── LOGIN ─────────────────────────────────────────────────────────────────────

@router.post("/login")
def login(
    email:    str     = Form(...),
    password: str     = Form(...),
    db:       Session = Depends(get_db),
):
    """Authenticate user and return JWT token."""

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": user.id})

    return {
        "message": "Login successful",
        "token":   token,
        "user": {
            "id":                     user.id,
            "name":                   user.name,
            "email":                  user.email,
            "body_shape":             user.body_shape,
            "measurement_confidence": user.measurement_confidence,
            "r1":                     user.r1,
            "r2":                     user.r2,
        },
    }


# ── ME ────────────────────────────────────────────────────────────────────────

@router.get("/me")
def get_me(
    db:      Session = Depends(get_db),
    user_id: int     = Depends(get_current_user_id),
):
    """Return the profile of the currently authenticated user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id":                     user.id,
        "name":                   user.name,
        "email":                  user.email,
        "body_shape":             user.body_shape,
        "measurement_confidence": user.measurement_confidence,
        "r1":                     user.r1,
        "r2":                     user.r2,
    }


# ── UPDATE IMAGE ───────────────────────────────────────────────────────────────

@router.put("/update-image")
async def update_image(
    image:   UploadFile = File(...),
    db:      Session    = Depends(get_db),
    user_id: int        = Depends(get_current_user_id),
):
    """
    Re-process a new body image for an already-registered user.
    Updates measurements only — name, email, password unchanged.
    Same validation and privacy policy as registration.
    """

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file_bytes = await image.read()
    SW, HW, TL, LL, R1, R2, body_shape, measurement_confidence = (
        await _process_image(file_bytes)
    )

    user.sw                     = SW
    user.hw                     = HW
    user.tl                     = TL
    user.ll                     = LL
    user.r1                     = R1
    user.r2                     = R2
    user.body_shape             = body_shape
    user.measurement_confidence = measurement_confidence

    db.commit()
    db.refresh(user)

    return {
        "message": "Measurements updated successfully",
        "user": {
            "id":                     user.id,
            "name":                   user.name,
            "email":                  user.email,
            "body_shape":             user.body_shape,
            "measurement_confidence": user.measurement_confidence,
            "r1":                     user.r1,
            "r2":                     user.r2,
        },
    }