# AI Proctoring Platform: Full Tech Stack Overview

This document provides a comprehensive breakdown of the technologies, architectures, and compatibility tests used in the AI Proctoring Platform.

## 1. Frontend Architecture (React Ecosystem)
The frontend is a modern, high-performance web application built with **React.js**. It features a premium, professional UI tailored for both candidates and recruiters.

*   **Core Library**: React.js 18.2.0
*   **Language**: JavaScript / JSX
*   **Styling Engine**: **Tailwind CSS** (for utility-first, responsive, and professional UI design).
*   **Navigation**: **React Router DOM v6** for seamless single-page application navigation.
*   **Stateful UI Components**:
    *   **Monaco Editor**: Integrated via `@monaco-editor/react` to provide a VS Code-like coding experience for candidates.
    *   **React Webcam**: For high-quality frame capture and streaming to the AI monitor.
    *   **Recharts**: For visualizing candidate performance and proctoring metrics in the HR dashboard.
    *   **Lucide React**: Premium iconography system.
*   **Real-time Layer**: **StompJS + SockJS** for low-latency WebSocket communication with the backend.
*   **Data Fetching**: **Axios** with interceptors for JWT-based secure communication.

---

## 2. Backend Architecture (Spring Boot Ecosystem)
The backend is a robust, secure, and scalable microservice written in **Java** using the **Spring Boot** framework.

*   **Framework**: Spring Boot 3.2.0 (Java 17)
*   **Security Layer**: 
    *   **Spring Security**: Role-based access control (Admin, HR, Candidate).
    *   **JWT (JJWT Library)**: Stateless authentication for secure API access.
*   **Data Layer**:
    *   **Spring Data JPA**: For database abstraction and ORM.
    *   **PostgreSQL**: Primary production database for storing assessment data, logs, and results.
    *   **H2 Database**: used for rapid development and integration testing.
*   **Integration Layer**:
    *   **Spring Mail**: For automated candidate invitation and result delivery.
    *   **WebSockets**: For real-time monitoring, live feeds, and status updates.
*   **Compiler Integration**: **Judge0 API** interaction for multi-language code execution.

---

## 3. AI Monitoring & Intelligence (Python Service)
The "brain" of the platform is a dedicated Python service that handles real-time computer vision and generative AI tasks.

*   **Primary Framework**: **Flask** (Python 3.9+)
*   **Computer Vision (CV)**:
    *   **MediaPipe**: The core engine for facial landmark detection and iris tracking.
    *   **YOLOv8 (Ultralytics)**: Used specifically for **Object Detection** (detecting mobile phones) and as a robust fallback for face detection.
    *   **OpenCV**: For frame manipulation and image preprocessing.
*   **Generative AI (LLM)**:
    *   **Google Gemini (gemini-flash-latest)**:
        *   **Question Generation**: Automatically creates technical MCQ questions from uploaded PDF course materials.
        *   **Behavior Synthesis**: Summarizes complex proctoring logs into human-readable recruiter summaries.
*   **Mathematical Libraries**: **NumPy**, **SciPy**, and **Pillow** for advanced geometric analysis of head pose and eye movements.

---

## 4. Hardware & System Compatibility (Device Check)
The platform includes a mandatory "System Calibration" (Compatibility Test) module to ensure a smooth and fair exam experience.

| Test Category | Methodology | Requirement |
| :--- | :--- | :--- |
| **Camera** | Real-time face detection check via AI Monitor. | Exactly 1 face visible. |
| **Microphone** | AudioContext frequency analysis of ambient noise. | Sensitivity > 5 units. |
| **Speakers** | User-confirmed playback of a "Sonic Pulse" file. | Audible to candidate. |
| **Network** | Latency (Ping) test and bandwidth stability check. | < 500ms (Ideally < 100ms). |
| **Integrity** | Browser tab-switch detection and clipboard lock. | Chrome/Firefox (Latest). |

---

## 5. Infrastructure & Deployment
*   **Containerization**: **Docker** for consistent environments across development and production.
*   **Orchestration**: **Docker Compose** managing four primary containers:
    1.  `frontend`: React application.
    2.  `backend`: Spring Boot API.
    3.  `ai-monitor`: Python Flask AI service.
    4.  `postgres`: Database storage.
*   **Scalability**: Stateless architecture allowing for horizontal scaling of the AI service.
