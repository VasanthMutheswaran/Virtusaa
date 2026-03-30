# AI Proctoring Platform: Literal Step-by-Step Flow

This document provides a "click-by-click" journey of different users on the platform.

---

## 👨‍💼 HR / Admin Portal Flow (Recruitment Lifecycle)

| Step | User Action | System Process (What's Happening) | Technical Detail |
| :--- | :--- | :--- | :--- |
| **1** | Open Browser & Go to `/hr/login` | Frontend loads the Login component. | `HRLogin.js` is rendered. |
| **2** | Enter Email/Password & Click **Login** | Frontend sends credentials to Backend. | API call to `/api/auth/login`. Returns a **JWT Token**. |
| **3** | Land on **Dashboard** | Frontend stores JWT and fetches all assessments. | `HRDashboard.js` calls `api/assessments/all`. |
| **4** | Click **Create New Assessment** | Form opens for basic test details (Title, Duration). | `AssessmentForm.js` manages state. |
| **5** | (Optional) **Upload PDF** & Click Generate | PDF is sent to the AI Monitor service. | `PyPDF2` extracts text; **Google Gemini** builds MCQ JSON. |
| **6** | Click **Add Candidate** | Recruiter enters Name & Email into a dynamic list. | State updated in `CandidateList.js`. |
| **7** | Click **Save & Send Invitations** | Backend generates unique tokens for each candidate. | `EmailService.java` sends SMTP emails via Spring Mail. |
| **8** | Click **Monitor Live** | Recruiter opens a live view of active exam sessions. | **WebSocket** connection established via `StompJS`. |
| **9** | Land on **Candidate Report** | Recruiter views score, violations, and AI summary. | `ResultService.java` aggregates data from DB & Gemini. |

---

## 🧑‍💻 Candidate Portal Flow (Examination Lifecycle)

| Step | User Action | System Process (What's Happening) | Technical Detail |
| :--- | :--- | :--- | :--- |
| **1** | Open **Email** & Click Assessment Link | Link contains a unique token (e.g., `?token=XYZ`). | Token validation via `JwtAuthFilter.java` on the backend. |
| **2** | Landing on **Welcome Page** | Frontend verifies assessment rules and sets session. | `ExamLanding.js` fetches data from `/api/exam/start`. |
| **3** | Click **Start Calibration** | The **Device Check** component initializes. | `DeviceCheck.js` starts webcam stream. |
| **4** | **Camera Check** (Automatic) | Snapshot is sent to AI Monitor for face count. | `FaceDetector.py` (MediaPipe) ensures exactly 1 face. |
| **5** | **Mic Check** (Say "Hello") | System monitors audio input levels. | `AudioContext` freq analysis compares level to threshold (>5). |
| **6** | **Network Check** (Automatic) | System pings the server three times. | Latency calculated in `useConnectivity.js`. |
| **7** | Click **Finalize & Start Exam** | Timer begins; proctoring background loop starts. | Session status changed to `IN_PROGRESS` in PostgreSQL. |
| **8** | Answer **MCQ Questions** | Each click triggers a periodic "Auto-save". | `ExamService.java` updates `CandidateResponse` table. |
| **9** | Open **Coding Section** | Monaco Editor initializes with syntax highlighting. | `ExamRoom.js` renders `@monaco-editor/react`. |
| **10**| Click **Run Code** | Code is sent to a secure sandbox executor. | POST to **Judge0 API**. Response returns stdout/stderr. |
| **11**| Click **Submit Assessment** | Session is locked; user cannot re-enter. | Session status set to `SUBMITTED`; Timer cleared. |

---

## 🤖 Under-the-Hood: The Proctoring Guard (Runs Every 2 Seconds)

While the Candidate follows the steps above, this "Ghost Loop" is running:

1.  **Snapshot**: `Webcam.js` captures a low-res Base64 string from the camera.
2.  **AI Analysis**: The frame hits `ai-monitor/analyze`.
    *   **MediaPipe** checks eye gaze (Looking away).
    *   **YOLOv8** checks for mobile devices (Object class 67).
3.  **Local Violation**: Frontend checks for `tab-switch` (Focus loss) or `clipboard` usage.
4.  **Logging**: All violations are sent as a batch to the **Backend**.
5.  **Alerting**: The Backend saves to `ProctoringLogRepository` and pushes a message to the HR's browser automatically via **WebSockets**.
6.  **Summarization**: On final submission, the Backend sends all logs to **Gemini** to write the behavior summary seen by HR.
