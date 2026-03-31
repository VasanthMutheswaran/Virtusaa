# Segment 7: Frontend - Secure Candidate Exam Room

The `ExamRoom` is the most critical frontend component, responsible for enforcing the POC's security requirements and providing a high-performance IDE experience.

## 1. Exam Room Orchestrator (frontend/src/pages/ExamRoom.js)
This component manages the synchronized timer, real-time proctoring data stream, and the fullscreen lockdown events.

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { examAPI } from '../services/api';
import ProctoringMonitor from '../components/Common/ProctoringMonitor';
import CodeEditor from '../components/Candidate/CodeEditor';

export default function ExamRoom() {
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // SECURITY: Fullscreen Lockdown Enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isStarted) {
        examAPI.logViolation({
          violationType: 'FULLSCREEN_EXIT',
          severity: 'HIGH',
          description: 'Candidate exited secure environment'
        });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isStarted]);

  // STREAM: WebSocket Screen Share Status
  const startScreenStreaming = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    // Sends frame-by-frame to Spring Boot over STOMP
    const client = createStompClient((c) => {
        setInterval(() => sendFrame(stream, c), 2000);
    });
  };

  return (
    <div className="exam-layout">
        <ProctoringMonitor onViolation={(v) => logToBackend(v)} />
        <CodeEditor />
        <Timer value={timeLeft} />
    </div>
  );
}
```

## 2. Integrity Bridge: ProctoringMonitor
This sub-component (documented further in Segment 4) is the bridge between the candidate's hardware and the AI Monitor. It captures silent screenshots every 2 seconds and POSTs them to the `/analyze` endpoint of the Flask service.

---
**Team**: ILLUSION  
**Institution**: Rajalakshmi Engineering College  
**Event**: Virtusa Jatayu Season 5
