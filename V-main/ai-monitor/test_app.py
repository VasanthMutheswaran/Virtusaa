import requests
import base64
import json

def test_health():
    try:
        r = requests.get("http://localhost:5000/health")
        print(f"Health check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Health check failed (is server running?): {e}")

def test_analyze():
    # Simple black 100x100 BGR image
    import numpy as np
    import cv2
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, buffer = cv2.imencode('.jpg', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    try:
        r = requests.post("http://localhost:5000/analyze", json={"image": img_base64})
        print(f"Analyze check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Analyze check failed: {e}")

def test_summarize():
    data = {
        "candidateName": "Test Candidate",
        "logs": [
            {"violationType": "PHONE_DETECTED", "description": "Mobile phone visible", "occurredAt": "10:00:00"},
            {"violationType": "LOOKING_AWAY", "description": "Candidate distracted", "occurredAt": "10:05:00"}
        ]
    }
    try:
        r = requests.post("http://localhost:5000/summarize", json=data)
        print(f"Summarize check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Summarize check failed: {e}")

if __name__ == "__main__":
    test_health()
    test_analyze()
    test_summarize()
