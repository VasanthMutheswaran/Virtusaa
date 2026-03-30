# 🏆 Master Project Review Guide: AI Proctoring Platform

This is the definitive technical guide for your project review. It covers the **what**, **why**, and **how** of every component, including a specialized presentation guide for your team of 5.

---

## 👥 Part 1: Team Presentation Blueprint (5 Persons)

To wow the reviewers, divide the presentation into these specialized roles:

| Role | Responsibility | Key Talking Points |
| :--- | :--- | :--- |
| **Person 1** | **Project Architect** | Core problem, Milestones, and High-Level Architecture. |
| **Person 2** | **GenAI & RAG Specialist** | PDF text extraction, Prompt Engineering, and Gemini integration. |
| **Person 3** | **Frontend & Security Lead** | React/Tailwind UI, Monaco Editor, and Fullscreen enforcement. |
| **Person 4** | **Computer Vision Engineer** | MediaPipe (Face/Eyes), Head Pose math, and YOLOv8 phone detection. |
| **Person 5** | **Backend & DevOps Lead** | Spring Boot logic, PostgreSQL, SMTP Emailing, and Docker deployment. |

---

## 🛠️ Part 2: The Tech Stack (The "Why")

### **1. Frontend: The "Candidate Interface"**
*   **React.js (v18)**: Chosen for its state management (crucial for keeping exam timers and proctoring status synced without page reloads).
*   **Tailwind CSS**: Used to implement a "premium" design system. The **Glassmorphic** effect in the dashboard creates a modern, high-tech look.
*   **Monaco Editor**: Instead of a simple text box, we integrated the engine that powers VS Code to provide syntax highlighting and professional coding features.

### **2. Backend: The "Command Center"**
*   **Spring Boot (Java 17)**: The backbone of the platform. It handles multi-threaded requests and provides a secure, production-ready environment.
*   **Spring Security + JWT**: Essential for "Stateless Authentication." It ensures that a candidate’s test session cannot be intercepted or spoofed.
*   **PostgreSQL**: Handles complex relational data (joining Candidates to specific Assessments and logging every single proctoring violation with timestamps).

### **3. AI Processing: The "Proctoring Eye"**
*   **Python (Flask)**: We used Python specifically because it has the best libraries for Computer Vision (OpenCV) and Machine Learning.
*   **MediaPipe**: Chosen over other libraries because it is extremely fast and can run face-mesh detection (468 landmarks) even on machines without a GPU.
*   **YOLOv8 (You Only Look Once)**: A state-of-the-art neural network used specifically to detect mobile phones in real-time.

---

## 🤖 Part 3: Deep Dive: How RAG MCQ Generation Works

**RAG (Retrieval-Augmented Generation)** is the secret sauce that makes our question generation 100% accurate.

1.  **Retrieval**: Using `PyPDF2`, we extract the raw technical content from your uploaded PDF.
2.  **Augmentation**: We don't just ask AI to "make a test." We inject the PDF text into a system prompt: *"Use ONLY the following context to create questions: [PDF TEXT]"*.
3.  **Generation**: **Gemini-Flash 1.5** reads the context and outputs a strictly formatted **JSON** object (Question, 4 Options, Correct Answer).
4.  **Benefit**: This eliminates "AI Hallucinations" (the AI won't make up things that weren't in your document).

---

## 👁️ Part 4: Deep Dive: Computer Vision Algorithms

### **1. Eye Gaze (Iris Ratio)**
*   **Logic**: We locate the eye outer corners and the iris center.
*   **Math**: We calculate the ratio: `(Iris_X - Left_Corner_X) / Eye_Width`.
*   **Threshold**: If the ratio goes below 0.35 (looking right) or above 0.65 (looking left), the system logs a **"LOOKING AWAY"** violation.

### **2. Head Pose (Yaw & Pitch)**
*   **Logic**: We treat the face as a 3D object in a 2D space.
*   **Algorithm**: We use the symmetry of the nose relative to the eyes to estimate **Yaw** (turning left/right) and the distance between the nose and chin to estimate **Pitch** (tilting up/down).
*   **Threshold**: A turn of >30° triggers a **"SUSPICIOUS MOVEMENT"** log.

---

## 🔄 Part 5: The Full Project Flow ("A to Z")

1.  **Admin Setup**: Admin uploads a Job Description (PDF) -> RAG generates MCQs -> Admin invites Candidates via **SMTP Email**.
2.  **The Lockdown**: Candidate enters the **ExamRoom**. React forces **Fullscreen Mode**. If they try to escape (Alt+Tab), the system detects a `blur` event and locks the screen.
3.  **Active Proctoring**: The webcam captures frames every second. The **Python service** runs MediaPipe/YOLO. If a phone is detected, it’s instantly logged to **PostgreSQL**.
4.  **Secure Evaluation**: 
    *   **Quiz**: Auto-graded by the Spring Boot engine.
    *   **Coding**: The solution is sent to the **Judge0 API** sandbox, which runs the code against hidden test cases.
5.  **Final Report**: Admin views a unified dashboard showing the score vs. the "Violation Score" to decide if the candidate cheated.

---

## 🐳 Part 6: Infrastructure & Deployment
*   **Docker & Docker-Compose**: We containerized the entire project. This means the DB, Backend, and AI Module all start together with one command, ensuring consistency across different environments.
*   **Async Logic**: We use `@Async` in Spring Boot for sending emails, ensuring the system remains responsive even during high-traffic invitation bulk-sends.
