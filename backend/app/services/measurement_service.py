import math


def euclidean(p1, p2):
    return math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)


def extract_measurements(landmarks):

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    left_hip = landmarks[23]
    right_hip = landmarks[24]

    left_ankle = landmarks[27]
    right_ankle = landmarks[28]

    # Shoulder width
    SW = euclidean(left_shoulder, right_shoulder)

    # Hip width
    HW = euclidean(left_hip, right_hip)

    # Torso length
    TL = (
        euclidean(left_shoulder, left_hip) +
        euclidean(right_shoulder, right_hip)
    ) / 2

    # Leg length
    LL = (
        euclidean(left_hip, left_ankle) +
        euclidean(right_hip, right_ankle)
    ) / 2

    return SW, HW, TL, LL