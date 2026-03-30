"""
Eye Tracking Module
Analyzes gaze direction to detect if candidate is looking away from screen
"""

import numpy as np
from typing import Dict, Any, Optional


class EyeTracker:
    # MediaPipe face mesh landmark indices for eyes
    LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
    LEFT_IRIS = [474, 475, 476, 477]
    RIGHT_IRIS = [469, 470, 471, 472]

    def __init__(self, gaze_threshold: float = 0.35):
        self.gaze_threshold = gaze_threshold

    def analyze(self, image: np.ndarray, landmarks) -> Dict[str, Any]:
        """
        Analyze eye gaze to determine if looking away.
        Returns: { looking_away, gaze_direction, confidence }
        """
        if landmarks is None:
            return {'looking_away': False, 'gaze_direction': 'unknown'}

        h, w = image.shape[:2]
        lm = landmarks.landmark

        try:
            # Get iris center positions
            left_iris_x = np.mean([lm[i].x for i in self.LEFT_IRIS])
            left_iris_y = np.mean([lm[i].y for i in self.LEFT_IRIS])
            right_iris_x = np.mean([lm[i].x for i in self.RIGHT_IRIS])
            right_iris_y = np.mean([lm[i].y for i in self.RIGHT_IRIS])

            # Get eye corners for reference
            left_eye_left = lm[33]
            left_eye_right = lm[133]
            right_eye_left = lm[362]
            right_eye_right = lm[263]

            # Calculate iris position ratio within eye (0=left, 1=right)
            left_ratio_x = (left_iris_x - left_eye_left.x) / max(
                abs(left_eye_right.x - left_eye_left.x), 0.001)
            right_ratio_x = (right_iris_x - right_eye_left.x) / max(
                abs(right_eye_right.x - right_eye_left.x), 0.001)

            avg_ratio = (left_ratio_x + right_ratio_x) / 2

            # Determine gaze direction
            if avg_ratio < self.gaze_threshold:
                direction = 'right'
                looking_away = True
            elif avg_ratio > (1 - self.gaze_threshold):
                direction = 'left'
                looking_away = True
            else:
                direction = 'center'
                looking_away = False

            return {
                'looking_away': looking_away,
                'gaze_direction': direction,
                'iris_ratio': float(avg_ratio)
            }

        except (IndexError, AttributeError):
            return {'looking_away': False, 'gaze_direction': 'unknown'}
