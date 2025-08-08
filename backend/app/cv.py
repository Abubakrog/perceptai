from io import BytesIO
from typing import Tuple

import cv2
import numpy as np
from PIL import Image


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