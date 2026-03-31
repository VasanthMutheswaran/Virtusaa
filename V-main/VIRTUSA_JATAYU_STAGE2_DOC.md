# <YOUR_COLLEGE_NAME>
# <YOUR_COLLEGE_NAME>

## AI-Powered Proctoring & Automated Assessment System
**Virtusa Jatayu Season 5 - Stage 2 Submission**

---

### Table of Contents
1. Project Overview .............................................................. Page 3
2. Problem Statement ............................................................. Page 4
3. Proposed Solution (POC) ...................................................... Page 5
4. System Architecture .......................................................... Page 6
5. Key Features ................................................................. Page 7
6. Tech Stack ................................................................... Page 8
7. Implementation Details ........................................................ Page 9
8. AI Monitoring & Intelligence ................................................. Page 10
9. Results & Dashboards ......................................................... Page 11
10. Team Members & Roles ........................................................ Page 12

---

# <YOUR_COLLEGE_NAME>
### 1. Project Overview
The **AI-Powered Proctoring & Automated Assessment System** is a next-generation platform designed to provide a secure, transparent, and efficient environment for conducting online examinations. It integrates advanced computer vision and generative AI to monitor candidate behavior and automate the assessment of both theoretical and technical coding skills.

# <YOUR_COLLEGE_NAME>
### 2. Problem Statement
Traditional online assessments suffer from several challenges:
- High risk of malpractice (cheating via external devices, tab switching, or proxies).
- Manual evaluation of coding assessments is time-consuming and error-prone.
- Lack of real-time monitoring insights for recruiters.
- Difficulty in generating quality question sets at scale.

# <YOUR_COLLEGE_NAME>
### 3. Proposed Solution (POC)
Our Proof of Concept (POC) addresses these issues by:
- **Real-time AI Monitoring**: Tracking head pose, eye movement, and object detection (mobiles) to ensure integrity using MediaPipe and YOLOv8.
- **Integrated Coding Environment**: A VS Code-like experience with an online compiler (Judge0 integration) for multi-language support.
- **Automated Grading**: Instant evaluation of MCQs and coding test cases with penalty logic for proctoring violations.
- **AI-Driven Question Generation**: Using Google Gemini (LLM) to create high-quality assessments from course materials.

# <YOUR_COLLEGE_NAME>
### 4. System Architecture
The system follows a modern microservices-inspired architecture:
- **Frontend**: A responsive React.js application offering a premium user experience with real-time feedback loops.
- **Backend API**: A secure Spring Boot service managing business logic, security, and data persistence via PostgreSQL.
- **AI Engine**: A dedicated Python Flask service handling real-time vision processing and LLM integrations.
- **Database**: PostgreSQL for robust data management and reliability.

### 5. Key Features
- **Secure Authentication**: Role-based access control using JWT.
- **Dynamic Assessments**: Creation of MCQ and coding-based tests with time limits.
- **Smart Proctoring**: Detection of:
    - Multiple people/No person.
    - Mobile phone usage.
    - Eye movement/Gaze tracking.
    - Head pose violations.
    - Tab switching and clipboard locking.
- **Interactive Coding Console**: Support for Java, Python, C++, and JavaScript.

### 6. Tech Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Recharts, Monaco Editor |
| **Backend** | Java 17, Spring Boot, Spring Security, JWT |
| **AI/ML** | Python, OpenCV, MediaPipe, YOLOv8, Google Gemini |
| **Database** | PostgreSQL |
| **DevOps** | Docker, Docker Compose |

### 7. Implementation Details
- **AI Monitor**: Decoupled from the main application to allow independent scaling of vision-intensive tasks.

### 8. Project Structure & Code Documentation
The source code is organized into a clean multi-module structure, with each core component professionally documented using industry-standard headers:
- `com.proctoring.service`: Handles business logic and AI integration.
- `com.proctoring.model`: JPA entities representing the domain model.
- `com.proctoring.repository`: Data access layer.
- `com.proctoring.dto`: Data transfer objects for frontend communication.

> [!NOTE]
> All core service and model files include a professional documentation header as per Virtusa Jatayu Season 5 requirements.

### 8. AI Monitoring & Intelligence
Our AI module uses **MediaPipe** for precise facial landmark detection and **YOLOv8** for object detection. The **Google Gemini** integration allows the platform to summarize proctoring logs into actionable insights for recruiters, significantly reducing the manual review time.

### 9. Results & Dashboards
Recruiters have access to a comprehensive dashboard that visualizes:
- Overall candidate performance.
- Detailed proctoring violation logs with timestamps.
- Normalized scores across different assessment types.

### 10. Team Members & Roles
- **<Team_Lead_Name>**: Full-Stack Development & Architecture
- **<Member_2_Name>**: AI/ML Engineer (Vision & LLM Integration)
- **<Member_3_Name>**: Frontend Developer (UI/UX & Monaco Editor)
- **<Member_4_Name>**: Backend Developer (Security & Database Design)
- **Team Name**: <YOUR_TEAM_NAME>

---

<div align="center">
  <b>Project Name:</b> AI-Powered Proctoring & Automated Assessment System | <b>Date of Submission:</b> 31-Mar-2026
</div>
