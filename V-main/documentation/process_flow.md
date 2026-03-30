# AI Proctoring Platform: Comprehensive Process Flow

This document provides an explainable, step-by-step breakdown of how the platform operates. It is divided into four main logical phases: Recruitment, Examination, AI Monitoring, and Evaluation.

---

## 1. Recruitment & Assessment Setup (Admin/HR Flow)
*The goal of this phase is to create a secure environment and define the evaluation criteria.*

```mermaid
graph TD
    A[HR Login] --> B[Dashboard]
    B --> C{Create Assessment}
    C -->|Manual| D[Enter MCQ & Coding Qs]
    C -->|AI Powered| E[Upload PDF Material]
    E --> F[Gemini Flash API]
    F --> D
    D --> G[Set Timing & Rules]
    G --> H[Add Candidates]
    H --> I[Send Invitations]
    I --> J[Email Service]
    J --> K[Candidate Receives Link/Token]
```

### Detailed Breakdown:
1.  **Identity Verification**: HR/Admin logs in using JWT-secured credentials.
2.  **Assessment Configuration**:
    *   **Manual Mode**: Recruiters enter questions, options, and coding challenges directly.
    *   **AI-Powered Mode**: Recruiters upload a PDF (e.g., a syllabus or technical doc). The **Python AI Service** extracts the text and sends it to **Google Gemini**. Gemini analyzes the concepts and returns structured JSON containing relevant technical MCQs.
3.  **Rule Definition**: Admins set time limits, total marks, and passing criteria.
4.  **Distribution**: Candidates are added to the system. The **Spring Boot Email Service** generates a unique, time-sensitive link for each candidate and sends it via SMTP.

---

## 2. Examination Lifecycle (Candidate Journey)
*This phase ensures a fair and controlled environment for the candidate.*

```mermaid
graph TD
    A[Click Email Link] --> B[Identity Authentication]
    B --> C[Exam Landing Page]
    C --> D[System Calibration/Device Check]
    D -->|Fail| E[Hardware/Network Fix]
    D -->|Pass| F[Start Examination]
    F --> G[Proctoring Active]
    G --> H{Assessment Sections}
    H --> I[MCQ Section]
    H --> J[Coding Section]
    I --> K[Auto-save Progress]
    J --> L[Real-time Compilation]
    K & L --> M[Final Submission]
    M --> N[Exam Complete Screen]
```

### Detailed Breakdown:
1.  **Secure Entry**: The candidate clicks the unique link, which validates their session token against the backend.
2.  **Hardware Guard (Calibration)**:
    *   **Camera**: The browser captures a frame and sends it to the AI Monitor. The AI ensures **exactly one person** is present (biometric lock).
    *   **Mic/Audio**: The system measures decibel levels to ensure the candidate can be heard and can hear proctoring alerts.
    *   **Network**: A ping test measures latency to guarantee the AI monitoring connection won't drop.
3.  **Assessment Flow**:
    *   **MCQs**: Responses are auto-saved to PostgreSQL via REST API as the user clicks next.
    *   **Coding**: Candidates use a **Monaco Editor** environment. When they "Run Code," the backend sends the snippet to the **Judge0 Compiler API** in a secure sandbox and returns the output instantly.
4.  **Finalization**: Upon completion or time expiration, the session is locked, and the status is updated to "Submitted."

---

## 3. Real-time AI Proctoring & Monitoring Feed
*This is the "Security Shield" that operates silently in the background.*

```mermaid
sequenceDiagram
    participant C as Candidate Browser
    participant B as Spring Boot Backend
    participant A as AI Monitor Service
    participant H as HR Dashboard

    rect rgb(240, 240, 240)
    Note over C, A: Continuous Loop (every ~2 seconds)
    C->>A: Send Webcam Frame (Base64)
    A->>A: MediaPipe Landmark Analysis
    A->>A: YOLOv8 Phone Detection
    A-->>C: Violation Detection Results
    end

    alt Violation Detected
        C->>B: Log Violation (WebSocket/REST)
        B->>B: Record in PostgreSQL
        B-->>H: Real-time Alert (WebSocket)
    end

    C->>B: Tab Switch / Clipboard Event
    B->>B: Record Violation
    B-->>H: Update Live Monitoring Feed
```

### Detailed Breakdown:
1.  **AI Detection Loop**:
    *   Every 2 seconds, the frontend captures a frame from the webcam.
    *   **Face/Eye Tracking**: **MediaPipe** maps 468 facial landmarks to detect if the candidate is looking away or if multiple people are in the frame.
    *   **Object Detection**: **YOLOv8** scans the frame specifically for mobile phones (COCO Class 67).
2.  **Browser Monitoring**: The frontend listens for `visibilitychange` (tab switching) and `copy/paste` events. Use of these results in an immediate violation log.
3.  **Instant Reporting**: Any detected violation is sent to the **Spring Boot Backend**. The backend records the event in the database and broadcasts a **WebSocket message** to the HR Dashboard, allowing recruiters to see "Live Alerts" immediately.

---

## 4. Evaluation & Results (Post-Exam Flow)
*This phase provides actionable insights and final verdicts for hiring.*

```mermaid
graph TD
    A[Candidate Submission] --> B{Evaluation Engine}
    B --> C[MCQ Auto-Grading]
    B --> D[Coding: Judge0 Sandbox]
    C & D --> E[Store Total Score]
    E --> F[AI Behavior Analysis]
    G[Proctoring Logs] --> H[Gemini Behavior Summary]
    H --> I[Generate Final Report]
    I --> J[HR Review & Manual Verdict]
    J --> K[Send Result Email to Candidate]
```

### Detailed Breakdown:
1.  **Automated Grading**:
    *   MCQs are compared against the answer key.
    *   Coding marks are calculated based on hidden test cases passed in the Judge0 sandbox.
2.  **AI Behavior Summary**: The **Result Service** gathers all proctoring logs (looking away, phone detected, etc.) and sends them to **Google Gemini**. Gemini synthesizes these into a professional 2-3 sentence summary (e.g., "Candidate maintained high integrity with minor distractions").
3.  **Recruiter Review**: HR reviews the consolidated report:
    *   Total Score (MCQ + Coding).
    *   Violation Timeline (Screenshots/Logs).
    *   AI-generated behavior summary.
4.  **Final Decision**: HR sets a verdict (Selected/Rejected). The system sends a final automated email to the candidate with their result notification.
