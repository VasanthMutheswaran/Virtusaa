# Team Presentation Guide: AI Proctoring Platform Review

This guide divides the project into 5 clear roles for your team presentation. Use this to ensure every technical aspect is covered professionally.

---

## 👤 Person 1: Project Overview & Milestones
**Focus**: The "Big Picture" and Project Management.
*   **Introduction**: Explain the core problem (Cheating in online exams) and our solution.
*   **Milestones**: 
    1.  Design & Architecture setup (React + Spring Boot).
    2.  AI Model Integration (MediaPipe & Gemini).
    3.  End-to-end testing with real PDFs.
*   **High-Level Architecture**: Explain the 4 main modules (Frontend, Backend, AI Monitor, Database).
*   **Impact**: How this project improves hiring efficiency and trust.

---

## 👤 Person 2: AI Question Generation (The RAG Expert)
**Focus**: How the system "thinks" and creates tests.
*   **Retrieval-Augmented Generation (RAG)**: Explain why we don't just use a standard AI. We use a PDF as the "Source of Truth."
*   **The Pipeline**: Upload PDF -> `PyPDF2` (Text Extraction) -> Prompt Augmentation.
*   **Gemini AI**: Explain the integration with Google's Gemini-Flash model to generate structured JSON MCQs.
*   **Automation**: Highlight how this replaces hours of manual test creation.

---

## 👤 Person 3: Candidate Experience & UI/UX
**Focus**: The React Frontend and Exam Security.
*   **Frontend Stack**: React.js, Tailwind CSS, and Lucide Icons.
*   **The Exam Room**: Demonstrate the side-by-side view (Questions vs. Code Editor).
*   **Monaco Editor**: Explain how we integrated a VS-Code-like environment for candidates.
*   **Security Features**: Talk about **Enforced Fullscreen** and **Tab-Switch Detection** built into the React logic.

---

## 👤 Person 4: AI Proctoring Specialist
**Focus**: Python, Computer Vision, and Real-time Monitoring.
*   **The AI Backend**: Flask-based Python service.
*   **Face & Eye Tracking**: Explain the mathematics of **Iris Ratios** and **Head Pose (Yaw/Pitch)** using **MediaPipe**.
*   **Object Detection**: Speak about **YOLOv8** and its ability to detect hidden mobile phones in the webcam feed.
*   **Performance**: How we use "Nano" models to ensure the proctoring runs smoothly even on older laptops.

---

## 👤 Person 5: Result Evaluation & Communication
**Focus**: Backend Logic, Scoring, and Data Persistence.
*   **The Engine**: Spring Boot & Java 17 logic.
*   **Scoring Algorithms**: Explain how quiz answers are compared with the AI-generated key and how Coding questions use **Judge0** for automated grading.
*   **Proctoring Logs**: Explain how violations (from Person 4) are saved into **PostgreSQL** as evidence.
*   **Communication**: Talk about the **Email System (SMTP)** used to invite candidates and send their final performance reports.
