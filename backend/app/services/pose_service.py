import mediapipe as mp
import cv2

mp_pose = mp.solutions.pose


def extract_pose_landmarks(image):

    pose = mp_pose.Pose(static_image_mode=True)

    results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    if not results.pose_landmarks:
        return None

    landmarks = results.pose_landmarks.landmark

    return landmarks