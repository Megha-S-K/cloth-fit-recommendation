import cv2
import numpy as np


def preprocess_image(file_bytes: bytes) -> np.ndarray:
    """
    Convert raw uploaded image bytes into a preprocessed BGR numpy array
    ready for MediaPipe pose estimation.

    Note on aspect ratio
    --------------------
    Since pose_service.py now uses pose_world_landmarks (real-world metric
    coordinates in metres), the image aspect ratio no longer affects the
    accuracy of body proportion ratios. World landmarks are estimated from
    a 3D body model and are independent of image dimensions.

    We still resize to 512px on the longer side (not square) to give
    MediaPipe a consistently sized input without introducing distortion.
    CLAHE contrast enhancement is retained to help landmark detection
    in poorly lit photos.

    Returns BGR numpy array.
    """

    # 1. Decode bytes → BGR
    np_arr = np.frombuffer(file_bytes, np.uint8)
    image  = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError(
            "Could not decode image. Please upload a valid JPG or PNG file."
        )

    # 2. Resize longest side to 512px — preserves aspect ratio naturally
    h, w   = image.shape[:2]
    scale  = 512 / max(h, w)
    new_w  = int(w * scale)
    new_h  = int(h * scale)
    image  = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # 3. CLAHE contrast enhancement on L channel
    lab          = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b      = cv2.split(lab)
    clahe        = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced   = clahe.apply(l)
    lab_enhanced = cv2.merge((l_enhanced, a, b))
    image        = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

    # 4. Return BGR — pose_service handles final BGR→RGB for MediaPipe
    return image