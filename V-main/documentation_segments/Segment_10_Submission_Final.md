# Segment 10: Final Deployment & Submission Checklist

This concludes the technical documentation for Project **ILLUSION**. This segment provides the final instructions for deployment and the mandatory "How to Run" guide for evaluators.

## 1. How to Run the Project (Step-by-Step) 🔥

### Prerequisites
- **Java 17**: To run the backend Spring Boot application.
- **Python 3.10+**: For the AI Monitor (MediaPipe/YOLOv8).
- **Node.js 18+**: For the React frontend.
- **PostgreSQL**: Local or cloud instance.

### Step 1: Initialize Database
Create a database named `proctoring_db` and update `backend/src/main/resources/application.properties` with your credentials.

### Step 2: Start Backend (Spring Boot)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
*Port: 8080*

### Step 3: Start AI Monitor (Flask)
```bash
cd ai-monitor
pip install -r requirements.txt
python app.py
```
*Port: 5000 (Ensure GEMINI_API_KEY is in .env)*

### Step 4: Start Frontend (React)
```bash
cd frontend
npm install
npm start
```
*Port: 3000*

## 2. Mandatory Submission Checklist
- [x] **Annotated Source Code**: All segments (1-10) include full logic explanations.
- [x] **AI Model Availability**: The code uses `gemini-2.0-flash` for high uptime.
- [x] **Fallback Mechanisms**: Randomized libraries handle cases where the AI service might be offline.
- [x] **Integrity Enforcements**: Fullscreen, Tab-switching, and Multi-face detection are functional.

## 3. Final Statement
Developed by **Team ILLUSION** from **Rajalakshmi Engineering College**, this system represents the next generation of automated assessments. By blending Computer Vision, LLMs, and robust Full-stack engineering, we have created a solution that is technically sound, secure, and ready for industry deployment.

---
**Team Lead & Developers**: ILLUSION  
**Event**: Virtusa Jatayu Season 5  
**Submission Date**: 31-March-2026
