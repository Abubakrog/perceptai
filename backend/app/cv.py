from io import BytesIO
from typing import Tuple
import base64

import cv2
import numpy as np
from PIL import Image
import mediapipe as mp


def read_image_bytes_to_bgr(image_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    rgb_array = np.array(image)
    bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
    return bgr_array


def canny_edges(image_bgr: np.ndarray, low_threshold: int = 100, high_threshold: int = 200) -> np.ndarray:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, threshold1=low_threshold, threshold2=high_threshold)
    # convert edges (single channel) to BGR so it can be encoded as PNG color
    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    return edges_bgr


def encode_png(image_bgr: np.ndarray) -> bytes:
    success, buf = cv2.imencode(".png", image_bgr)
    if not success:
        raise RuntimeError("Failed to encode PNG")
    return buf.tobytes()


def detect_hands(image_bgr: np.ndarray) -> np.ndarray:
    """Detect hands in the image and draw landmarks"""
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    
    # Convert BGR to RGB for MediaPipe
    rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    with mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=0.5
    ) as hands:
        results = hands.process(rgb_image)
        
        # Convert back to BGR for drawing
        annotated_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    annotated_image, 
                    hand_landmarks, 
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
                )
        
        return annotated_image


def detect_faces(image_bgr: np.ndarray) -> np.ndarray:
    """Detect faces in the image and draw bounding boxes"""
    mp_face_detection = mp.solutions.face_detection
    mp_drawing = mp.solutions.drawing_utils
    
    # Convert BGR to RGB for MediaPipe
    rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    with mp_face_detection.FaceDetection(
        model_selection=0, 
        min_detection_confidence=0.5
    ) as face_detection:
        results = face_detection.process(rgb_image)
        
        # Convert back to BGR for drawing
        annotated_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
        
        if results.detections:
            for detection in results.detections:
                mp_drawing.draw_detection(annotated_image, detection)
        
        return annotated_image