"""
Face Detection Module using MediaPipe
Detects number of faces and returns facial landmarks
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, Any


class FaceDetector:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,  # 0 for short range, 1 for full range
            min_detection_confidence=0.5
        )
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=5,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def detect(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Detect faces in frame.
        Returns: { face_count, bounding_boxes, landmarks, confidence }
        """
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        detection_results = self.face_detection.process(rgb_image)
        mesh_results = self.face_mesh.process(rgb_image)

        face_count = 0
        bounding_boxes = []
        landmarks = None

        if detection_results.detections:
            face_count = len(detection_results.detections)
            h, w = image.shape[:2]
            for det in detection_results.detections:
                box = det.location_data.relative_bounding_box
                bounding_boxes.append({
                    'x': int(box.xmin * w),
                    'y': int(box.ymin * h),
                    'width': int(box.width * w),
                    'height': int(box.height * h),
                    'confidence': det.score[0]
                })

        if mesh_results.multi_face_landmarks:
            landmarks = mesh_results.multi_face_landmarks[0]

        face_box = None
        if bounding_boxes:
            b = bounding_boxes[0]
            face_box = (b['x'], b['y'], b['width'], b['height'])

        return {
            'face_count': face_count,
            'bounding_boxes': bounding_boxes,
            'face_box': face_box,
            'landmarks': landmarks,
        }
