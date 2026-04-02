# AI-Powered Proctoring & Automated Assessment System (Project ILLUSION)

[![Event](https://img.shields.io/badge/Event-Jatayu--Season--5-blue)]
[![Status](https://img.shields.io/badge/Status-POC--Stage--2-brightgreen)](https://github.com/VasanthMutheswaran/AI-Proctoring-System)

## 📌 Project Overview
**Project ILLUSION** is a high-performance proctoring and assessment platform developed for the **Jatayu Season 5 hackathon**. It utilizes advanced computer vision (MediaPipe/YOLOv8) and generative AI (Google Gemini API) to provide a secure, automated, and human-like exam monitoring experience.

## ✨ Key Features
- **AI Proctoring Service**: Real-time analysis of candidate behavior, including gaze tracking, multi-face detection, and prohibited object recognition (mobiles, etc.).
- **Automated Question Generation**: Dynamic creation of MCQs and coding problems directly from uploaded PDF study materials using Google Gemini API.
- **Oral Assessment Layer**: Interactive voice-based assessment with transcript generation and clarity scoring for detailed candidate evaluation.
- **Security Sandbox**: Lockdown features including fullscreen enforcement, visibility tracking (no tab-switching), and hardware validation.
- **HR Dashboard**: Centralized monitoring of proctoring logs and automated candidate results analysis.

## 🛠 Tech Stack
- **Frontend**: React.js, Axios, MediaPipe  
- **Backend**: Spring Boot 3.x (Java 17), PostgreSQL  
- **AI Engine**: Flask (Python 3.10), Google Gemini API, YOLOv8 (Ultralytics)  
- **DevOps**: Docker, Git  

## 🚀 Getting Started

### Prerequisites
- Java 17  
- Python 3.10+  
- Node.js 18+  
- PostgreSQL  

### Installation

1. **Clone the Repository**:
```bash
git clone https://github.com/VasanthMutheswaran/AI-Proctoring-System.git
cd AI-Proctoring-System

    ```
2.  **Environment Setup**:
    Create an `ai-monitor/.env` file:
    ```env
    GEMINI_API_KEY=your_actual_key_here
    ```
3.  **Start Services**:
    -   **Backend**: `cd backend && mvn spring-boot:run`
    -   **AI Monitor**: `cd ai-monitor && python app.py`
    -   **Frontend**: `cd frontend && npm install && npm start`

## 👥 Team: ILLUSION
-   **Institution**: Rajalakshmi Engineering College
-   **Members**: Vasanth M (Team Lead)

---
*Note: This repository is a POC for the Stage 2 submission of Jatayu Season 5.*
