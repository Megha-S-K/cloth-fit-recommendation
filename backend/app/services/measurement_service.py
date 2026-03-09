import math

# ── Landmark indices ────────────────────────────────────────────────────────
IDX_LEFT_SHOULDER  = 11
IDX_RIGHT_SHOULDER = 12
IDX_LEFT_HIP       = 23
IDX_RIGHT_HIP      = 24
IDX_LEFT_ANKLE     = 27
IDX_RIGHT_ANKLE    = 28

USED_LANDMARK_INDICES = [
    IDX_LEFT_SHOULDER, IDX_RIGHT_SHOULDER,
    IDX_LEFT_HIP,      IDX_RIGHT_HIP,
    IDX_LEFT_ANKLE,    IDX_RIGHT_ANKLE,
]

# ── Circumference conversion factors ───────────────────────────────────────
#
# MediaPipe world landmarks = JOINT-TO-JOINT distances (metres)
# brand_r1 = upper_body_cm / hip_cm = CIRCUMFERENCE ratio
#
# These are different spaces. To make user_r1 directly comparable
# to brand_r1 we convert joint distances to circumference equivalents:
#
#   chest_circumference ≈ SW_joint × K_s
#   hip_circumference   ≈ HW_joint × K_h
#
# Calibrated from anthropometry:
#   Typical adult SW_joint ≈ 0.31m, chest_circ ≈ 0.88m → K_s = 2.84
#   Typical adult HW_joint ≈ 0.22m, hip_circ   ≈ 0.95m → K_h = 4.32
#
# After applying these, user_r1 = (SW×K_s)/(HW×K_h) falls in the
# same range as brand_r1 = upper_body_cm/hip_cm:
#   Women: 0.88 – 0.99
#   Men:   1.00 – 1.08
#
SHOULDER_SCALE = 2.84   # converts shoulder joint width → chest circumference
HIP_SCALE      = 4.32   # converts hip joint width     → hip circumference
TORSO_SCALE    = 2.50   # converts torso joint length  → torso circumference
LEG_SCALE      = 1.20   # leg length needs less correction

# ── Validation bounds (circumference-ratio space) ──────────────────────────
R1_MIN, R1_MAX = 0.75, 1.20
R2_MIN, R2_MAX = 0.30, 0.90

PHOTO_GUIDELINES = (
    "Please upload a photo that meets these requirements:\n"
    "  • Full body visible from head to feet\n"
    "  • Standing straight, facing the camera directly\n"
    "  • Arms relaxed at sides (not raised or spread out)\n"
    "  • Fitted clothing — avoid very loose or baggy outfits\n"
    "  • Camera at body level, not above or below\n"
    "  • Plain background with good lighting\n"
    "  • At least 1.5–2 metres distance from the camera"
)


def euclidean(p1, p2) -> float:
    """3D Euclidean distance between two world landmark points (metres)."""
    return math.sqrt(
        (p1.x - p2.x) ** 2 +
        (p1.y - p2.y) ** 2 +
        (p1.z - p2.z) ** 2
    )


def extract_measurements(landmarks):
    """
    Compute circumference-equivalent body measurements from world landmarks.

    Converts MediaPipe joint-to-joint distances into circumference
    equivalents so user_r1 = SW_circ / HW_circ is directly comparable
    to brand_r1 = upper_body_cm / hip_cm in the brand database.

    Returns
    -------
    SW : float  Chest circumference equivalent
    HW : float  Hip circumference equivalent
    TL : float  Torso length equivalent
    LL : float  Leg length equivalent
    """
    ls = landmarks[IDX_LEFT_SHOULDER]
    rs = landmarks[IDX_RIGHT_SHOULDER]
    lh = landmarks[IDX_LEFT_HIP]
    rh = landmarks[IDX_RIGHT_HIP]
    la = landmarks[IDX_LEFT_ANKLE]
    ra = landmarks[IDX_RIGHT_ANKLE]

    SW_raw = euclidean(ls, rs)
    HW_raw = euclidean(lh, rh)
    TL_raw = (euclidean(ls, lh) + euclidean(rs, rh)) / 2
    LL_raw = (euclidean(lh, la) + euclidean(rh, ra)) / 2

    # Convert to circumference-equivalent space
    SW = SW_raw * SHOULDER_SCALE
    HW = HW_raw * HIP_SCALE
    TL = TL_raw * TORSO_SCALE
    LL = LL_raw * LEG_SCALE

    return SW, HW, TL, LL


def compute_measurement_confidence(landmarks) -> float:
    """Mean visibility score across the six used landmarks."""
    scores = [landmarks[i].visibility for i in USED_LANDMARK_INDICES]
    return round(sum(scores) / len(scores), 4)


def validate_ratios(R1: float, R2: float):
    """
    Validate ratios are anatomically realistic.
    Returns None if valid, error dict if not.
    """
    problems = []

    if not (R1_MIN <= R1 <= R1_MAX):
        direction = "wider than hips" if R1 > R1_MAX else "narrower than hips"
        problems.append(
            f"Shoulder-to-hip ratio out of range (R1={R1:.3f}). "
            f"Shoulders appear unrealistically {direction}. "
            f"Ensure you are facing directly towards the camera."
        )

    if not (R2_MIN <= R2 <= R2_MAX):
        problems.append(
            f"Torso-to-leg ratio out of range (R2={R2:.3f}). "
            f"Ensure full body from head to feet is visible."
        )

    if problems:
        return {
            "error":      "Body measurements could not be reliably extracted. " + " ".join(problems),
            "guidelines": PHOTO_GUIDELINES,
        }

    return None