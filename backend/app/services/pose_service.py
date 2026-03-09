import mediapipe as mp
import cv2

mp_pose = mp.solutions.pose


def extract_pose_landmarks(image):
    """
    Accepts a BGR numpy array (from OpenCV / preprocess_image).
    Returns pose_world_landmarks — NOT pose_landmarks.

    Why world landmarks?
    --------------------
    pose_landmarks returns coordinates normalised by image width/height
    independently (x in [0,1] relative to width, y in [0,1] relative
    to height). This means the scale of x vs y depends on image
    aspect ratio, and the absolute values depend on how much of the
    frame the person occupies.

    pose_world_landmarks returns real-world metric coordinates (metres)
    estimated from a 3D body model, with the hip midpoint as origin.
    These are completely independent of:
      - Image aspect ratio (portrait, landscape, square)
      - Camera distance / zoom level
      - How much of the frame the person fills
      - Whether the image was padded

    This is the correct input for computing body proportion ratios
    like R1 = SW/HW. Since both SW and HW are in the same unit
    (metres), their ratio is scale-invariant and reflects true anatomy.

    Returns None if pose detection fails.
    """
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,           # highest accuracy model
        min_detection_confidence=0.5,
    ) as pose:

        rgb     = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if not results.pose_world_landmarks:
            return None

        # Return world landmark list — units are metres, origin = hip midpoint
        return results.pose_world_landmarks.landmark