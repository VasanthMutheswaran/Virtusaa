# Segment 9: Security Infrastructure & Integrity Enforcement

This segment details the underlying security mechanics that prevent cheating and ensure the validity of every assessment session.

## 1. Proctoring Monitor Hook (frontend/src/components/Common/ProctoringMonitor.js)
This component is the "eyes and ears" of the system. It runs silently in the background of the exam room, capturing hardware telemetry and analyzing the candidate's environment via the Flask AI Service (Segment 4).

```javascript
/*
 @component ProctoringMonitor
 @description Real-time capture and AI analysis bridge.
*/
import React, { useRef, useEffect } from 'react';
import axios from 'axios';

export default function ProctoringMonitor({ sessionId, onViolation }) {
  const videoRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Hardware (Camera)
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
    });

    // 2. High-Frequency Analysis Loop (Every 2 seconds)
    const interval = setInterval(async () => {
      const frame = captureFrame(videoRef.current);
      try {
        const { data } = await axios.post('http://localhost:5000/analyze', {
          image: frame,
          sessionId: sessionId
        });
        
        // 3. Process AI Flags (e.g., Device Detected, Multiple Faces)
        if (data.violations.length > 0) {
          data.violations.forEach(v => onViolation(v));
        }
      } catch (e) { console.error("Proctoring service unavailable"); }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return <div className="hidden-proctor"><video ref={videoRef} autoPlay muted /></div>;
}

function captureFrame(video) {
  const canvas = document.createElement('canvas');
  canvas.width = 300; // Optimized size for AI latency reduction
  canvas.height = 300;
  canvas.getContext('2d').drawImage(video, 0, 0, 300, 300);
  return canvas.toDataURL('image/jpeg').split(',')[1];
}
```

## 2. Browser Sandbox Logic
The system implements a rigid "Focus-Only" environment using native DOM events:
- **`visibilitychange`**: Triggers a violation if the candidate switches tabs or minimizes the browser.
- **Fullscreen API**: Forces the UI into a dedicated layer. Re-entering requires an "Integrity Reset" which is logged in the backend.
- **Hardware Validation**: Before the exam starts, the system verifies that a valid Camera and Microphone are connected and the candidate's bandwidth is sufficient for real-time monitoring.

---
**Team**: ILLUSION  
**Institution**: Rajalakshmi Engineering College  
**Event**: Virtusa Jatayu Season 5
