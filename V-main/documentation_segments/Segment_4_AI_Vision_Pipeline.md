# Segment 4: AI Engine - Core Vision Monitoring Pipeline

This segment contains the production-grade computer vision logic within the AI Monitor. It processes real-time frames to detect behavioral anomalies.

## 1. Flask Orchestrator (ai-monitor/app.py - Vision Routes)
The following code represents the core `/analyze` endpoint. It implements a multi-step detection pipeline: Face Detection -> Gaze Analysis -> Object Detection (YOLOv8).

```python
"""
@project: AI Proctoring System
@module: Vision Engine
@description: Real-time analysis of candidate behavior.
"""
from flask import Flask, request, jsonify
import cv2
import numpy as np
import base64
from detectors.face_detector import FaceDetector
from ultralytics import YOLO

app = Flask(__name__)
face_detector = FaceDetector()
yolo_model = YOLO("yolov8s.pt") # Strategic choice: small model for speed

@app.route("/analyze", methods=["POST"])
def analyze():
    # 1. Decode Incoming Frame
    data = request.get_json()
    img_bytes = base64.b64decode(data['image'])
    nparr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    violations = []

    # 2. People Count (MediaPipe)
    face_results = face_detector.detect(image)
    if face_results['count'] == 0:
        violations.append({"type": "NO_FACE", "severity": "HIGH"})
    elif face_results['count'] > 1:
        violations.append({"type": "MULTIPLE_FACES", "severity": "HIGH"})

    # 3. Behavioral Flags (Looking Away)
    if face_results['count'] == 1:
        if face_results['is_looking_away']:
            violations.append({"type": "LOOKING_AWAY", "severity": "MEDIUM"})

    # 4. Object Detection (YOLOv8)
    # Detects cell phones, books, or laptops in the candidate's vicinity
    yolo_results = yolo_model(image, conf=0.5, verbose=False)
    for r in yolo_results:
        for box in r.boxes:
            label = yolo_model.names[int(box.cls[0])]
            if label in ["cell phone", "book", "laptop"]:
                violations.append({
                    "type": "DEVICE_DETECTED",
                    "severity": "HIGH",
                    "description": f"Prohibited item: {label}"
                })

    return jsonify({"violations": violations, "processed": True})
```

## 2. Advanced Gaze Detection (ai-monitor/detectors/face_detector.py)
This module uses MediaPipe FaceMesh to calculate head posture. We monitor the normalized coordinates of the nose landmark (Index 1) relative to the face boundaries.

```python
import mediapipe as mp
import cv2

class FaceDetector:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=2,
            min_detection_confidence=0.5
        )

    def detect(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        face_count = 0
        looking_away = False
        
        if results.multi_face_landmarks:
            face_count = len(results.multi_face_landmarks)
            if face_count == 1:
                # Gaze direction logic using nose landmark
                landmarks = results.multi_face_landmarks[0].landmark
                nose = landmarks[1]
                if nose.x < 0.35 or nose.x > 0.65: # Threshold for horizontal look-away
                    looking_away = True
                    
        return {'count': face_count, 'is_looking_away': looking_away}
```

---
**Team**: ILLUSION  
**Institution**: Rajalakshmi Engineering College  
**Event**: Virtusa Jatyu Season 5
