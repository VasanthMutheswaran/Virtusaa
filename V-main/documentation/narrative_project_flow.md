# AI Proctoring Platform: The Exact Narrative Flow

This document provides a detailed, textual "story" of how the platform works, tracing every action from the recruiter's first click to the candidate's final result.

---

## Part 1: The Recruiter's Setup (The Origin)
1.  **Dashboard Access**: A recruiter logs into the **HR Portal** (`frontend/src/pages/HRDashboard.js`). After authentication, the frontend requests all existing assessments from the **Backend API** via `AssessmentService.java`.
2.  **Creating the Test**: The recruiter clicks "Create Assessment". They have two choices:
    *   **Manual Entry**: They type questions directly into forms.
    *   **AI-Powered Generation**: They upload a PDF (e.g., a "Java Basics" manual).
3.  **The AI Magic (PDF Extraction)**: The frontend sends the PDF to the **Python AI Service** (`ai-monitor/app.py` at the `/generate` endpoint). 
    *   The Python service extracts the text using `PyPDF2`.
    *   It sends the text to **Google Gemini (LLM)** with a specific prompt to generate MCQs.
    *   Gemini returns a clean JSON list of questions, which the Python service passes back to the frontend.
4.  **Finalizing & Inviting**: The recruiter reviews the questions, sets a timer, and adds candidate email addresses. When they click "Invite," the **Backend** uses `EmailService.java` to send a professional email to each candidate containing a unique, secure URL (e.g., `assessment/start?token=XYZ`).

---

## Part 2: The Candidate's Experience (The Exam)
1.  **Arrival**: The candidate clicks the email link. The **Frontend** (`LandingPage.js`) immediately sends that token to `AuthService.java` on the backend to verify the candidate's identity and ensure the link hasn't expired.
2.  **The Security Gate (Device Check)**: Before the exam starts, the candidate must pass the **Device Check** (`components/Candidate/DeviceCheck.js`).
    *   **Face Lock**: The system takes a webcam photo. It sends it to the **AI Monitor** (`/analyze` endpoint). The AI verifies that **exactly one face** is visible. If not, the candidate cannot proceed.
    *   **Hardware Validation**: The system checks if the microphone is picking up sound and if the internet connection is stable enough for a live feed.
3.  **Taking the Exam**: Once "Started," the candidate enters the **Exam Room** (`pages/ExamRoom.js`).
    *   **MCQs**: Every time a candidate selects an answer, the frontend sends a `PATCH` request to `ExamService.java` to save progress instantly. 
    *   **Coding**: For coding tasks, the candidate types in a **Monaco Editor**. When they click "Run," the code is sent to the **Backend**, which forwards it to the **Judge0 API** (a secure execution sandbox). The output is returned and displayed in the candidate's console.

---

## Part 3: The Invisible Eye (The Proctoring Loop)
While the candidate is focused on questions, the "Security Shield" is running every **2 seconds**:
1.  **Frame Capture**: The frontend captures a hidden snapshot of the webcam.
2.  **AI Analysis**: This frame is sent to the **AI Monitor service**.
    *   **Eye & Head Tracking**: `MediaPipe` calculates if the candidate's eyes have left the screen for too long.
    *   **Object Detection**: `YOLOv8` looks for illegal items like mobile phones.
3.  **Violation Logging**: If a violation is detected (e.g., "Multiple Faces"), the AI Monitor returns a "HIGH" severity alert.
4.  **Real-time Alerts**: The frontend sends this violation to the backend (`ProctoringService.java`). 
    *   The backend saves it to **PostgreSQL**.
    *   **Crucially**, the backend then broadcasts this alert via **WebSockets** to the HR's live dashboard. The recruiter sees a red notification on their screen *instantly* without refreshing.

---

## Part 4: The Final Verdict (Results)
1.  **Submission**: When the timer runs out or the candidate clicks "Submit," the session is locked.
2.  **Grading**: 
    *   The **Backend** auto-grades MCQs. 
    *   Coding marks are calculated based on the test cases passed during the exam.
3.  **Behavior Synthesis**: The **Result Service** collects all proctoring violations recorded during the session. It sends this raw list to **Google Gemini** (`ai-monitor/app.py` at `/summarize`). Gemini writes a human-like summary of the candidate's integrity.
4.  **HR Review**: Recruiter opens the **Candidate Report** (`components/Admin/CandidateReport.js`). They see:
    *   Total Score.
    *   Code snippets written by the candidate.
    *   A timeline of proctoring violations with screenshots.
    *   The AI-generated behavior summary.
5.  **Completion**: The recruiter submits a manual "Verdict" (e.g., "Hired"). The backend triggers a final email to the candidate and closes the file.
