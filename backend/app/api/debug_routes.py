from fastapi import APIRouter, UploadFile, File
from app.services.image_preprocess_service import preprocess_image
from app.services.body_shape_service import compute_ratios, classify_body_shape
from app.services.measurement_service import (
    SHOULDER_SCALE, HIP_SCALE, TORSO_SCALE, LEG_SCALE,
    R1_MIN, R1_MAX, R2_MIN, R2_MAX,
)
import mediapipe as mp
import cv2
import math

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.post("/measure")
async def debug_measure(image: UploadFile = File(...)):
    """
    TEMPORARY DEBUG ENDPOINT — remove before production.
    Shows raw landmark values, raw measurements, scaled measurements,
    and final R1/R2 so you can verify the full pipeline.
    """
    file_bytes = await image.read()
    processed  = preprocess_image(file_bytes)

    mp_pose = mp.solutions.pose

    with mp_pose.Pose(static_image_mode=True, model_complexity=2) as pose:
        rgb     = cv2.cvtColor(processed, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if not results.pose_world_landmarks:
            return {"error": "No landmarks detected"}

        wl = results.pose_world_landmarks.landmark
        il = results.pose_landmarks.landmark

        def euc3d(a, b):
            return math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2)

        def euc2d(a, b):
            return math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)

        # Raw world joint distances
        SW_raw = euc3d(wl[11], wl[12])
        HW_raw = euc3d(wl[23], wl[24])
        TL_raw = (euc3d(wl[11], wl[23]) + euc3d(wl[12], wl[24])) / 2
        LL_raw = (euc3d(wl[23], wl[27]) + euc3d(wl[24], wl[28])) / 2

        # Scaled tape-equivalent
        SW = SW_raw * SHOULDER_SCALE
        HW = HW_raw * HIP_SCALE
        TL = TL_raw * TORSO_SCALE
        LL = LL_raw * LEG_SCALE

        R1, R2     = compute_ratios(SW, HW, TL, LL)
        body_shape = classify_body_shape(R1, R2)

        # Image coords for comparison
        SW_i = euc2d(il[11], il[12])
        HW_i = euc2d(il[23], il[24])
        R1_i = SW_i / HW_i

        return {
            "image_size": f"{processed.shape[1]}x{processed.shape[0]}",

            "world_landmarks_metres": {
                "left_shoulder":  {"x": round(wl[11].x,4), "y": round(wl[11].y,4), "z": round(wl[11].z,4), "vis": round(wl[11].visibility,3)},
                "right_shoulder": {"x": round(wl[12].x,4), "y": round(wl[12].y,4), "z": round(wl[12].z,4), "vis": round(wl[12].visibility,3)},
                "left_hip":       {"x": round(wl[23].x,4), "y": round(wl[23].y,4), "z": round(wl[23].z,4), "vis": round(wl[23].visibility,3)},
                "right_hip":      {"x": round(wl[24].x,4), "y": round(wl[24].y,4), "z": round(wl[24].z,4), "vis": round(wl[24].visibility,3)},
                "left_ankle":     {"x": round(wl[27].x,4), "y": round(wl[27].y,4), "z": round(wl[27].z,4), "vis": round(wl[27].visibility,3)},
                "right_ankle":    {"x": round(wl[28].x,4), "y": round(wl[28].y,4), "z": round(wl[28].z,4), "vis": round(wl[28].visibility,3)},
            },

            "raw_joint_distances_cm": {
                "SW": round(SW_raw * 100, 2),
                "HW": round(HW_raw * 100, 2),
                "TL": round(TL_raw * 100, 2),
                "LL": round(LL_raw * 100, 2),
                "R1_raw": round(SW_raw / HW_raw, 4),
                "note": "These are joint-to-joint distances — NOT comparable to brand data",
            },

            "scaled_tape_equivalent_cm": {
                "SW": round(SW * 100, 2),
                "HW": round(HW * 100, 2),
                "TL": round(TL * 100, 2),
                "LL": round(LL * 100, 2),
                "scaling_factors": {
                    "shoulder": SHOULDER_SCALE,
                    "hip":      HIP_SCALE,
                    "torso":    TORSO_SCALE,
                    "leg":      LEG_SCALE,
                },
                "note": "These are tape-measure equivalent — directly comparable to brand data",
            },

            "final_result": {
                "R1":         round(R1, 6),
                "R2":         round(R2, 6),
                "body_shape": body_shape,
                "R1_valid":   R1_MIN <= R1 <= R1_MAX,
                "R2_valid":   R2_MIN <= R2 <= R2_MAX,
            },

            "image_coords_comparison": {
                "SW_image": round(SW_i, 6),
                "HW_image": round(HW_i, 6),
                "R1_image": round(R1_i, 4),
                "note": "Image coords (old broken method) — shown for comparison only",
            },
        }