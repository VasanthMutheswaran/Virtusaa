"""
Head Pose Detection Module
Detects unusual head movements suggesting cheating behavior
"""

import numpy as np
from typing import Dict, Any, Optional


class HeadPoseDetector:
    # Nose tip and face contour landmarks for pose estimation
    NOSE_TIP = 4
    CHIN = 152
    LEFT_EYE_OUTER = 33
    RIGHT_EYE_OUTER = 263
    LEFT_MOUTH = 61
    RIGHT_MOUTH = 291

    def __init__(self, yaw_threshold: float = 30.0, pitch_threshold: float = 25.0):
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold

    def analyze(self, image: np.ndarray, landmarks) -> Dict[str, Any]:
        """
        Estimate head pose and detect suspicious movements.
        Returns: { suspicious_pose, yaw, pitch, roll, pose_description }
        """
        if landmarks is None:
            return {'suspicious_pose': False}

        h, w = image.shape[:2]
        lm = landmarks.landmark

        try:
            # Get key 3D points (MediaPipe provides z as relative depth)
            nose = np.array([lm[self.NOSE_TIP].x * w, lm[self.NOSE_TIP].y * h, lm[self.NOSE_TIP].z * w])
            chin = np.array([lm[self.CHIN].x * w, lm[self.CHIN].y * h, lm[self.CHIN].z * w])
            left_eye = np.array([lm[self.LEFT_EYE_OUTER].x * w, lm[self.LEFT_EYE_OUTER].y * h, lm[self.LEFT_EYE_OUTER].z * w])
            right_eye = np.array([lm[self.RIGHT_EYE_OUTER].x * w, lm[self.RIGHT_EYE_OUTER].y * h, lm[self.RIGHT_EYE_OUTER].z * w])

            # Approximate yaw (left-right rotation) using eye symmetry
            eye_center_x = (left_eye[0] + right_eye[0]) / 2
            face_center_x = w / 2
            eye_width = abs(right_eye[0] - left_eye[0])

            # Normalize yaw estimate
            yaw = ((nose[0] - eye_center_x) / max(eye_width, 1)) * 90
            
            # Approximate pitch (up-down) using nose-chin angle
            face_height = abs(chin[1] - nose[1])
            expected_y = (chin[1] + nose[1]) / 2
            pitch = ((nose[1] - expected_y) / max(face_height, 1)) * 90

            suspicious = False
            description = []

            if abs(yaw) > self.yaw_threshold:
                suspicious = True
                direction = 'right' if yaw > 0 else 'left'
                description.append(f'Head turned {direction} ({abs(yaw):.0f}°)')

            if abs(pitch) > self.pitch_threshold:
                suspicious = True
                direction = 'down' if pitch > 0 else 'up'
                description.append(f'Head tilted {direction} ({abs(pitch):.0f}°)')

            return {
                'suspicious_pose': suspicious,
                'yaw': float(yaw),
                'pitch': float(pitch),
                'pose_description': ', '.join(description) if description else 'normal'
            }

        except (IndexError, AttributeError, ZeroDivisionError):
            return {'suspicious_pose': False}
