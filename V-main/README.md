# AI Proctoring Online Assessment Platform

A full-stack secure online examination platform with AI-based proctoring, coding assessments, and quiz evaluation.

## Architecture

```
ai-proctoring-platform/
├── frontend/          # React.js + Tailwind CSS
├── backend/           # Spring Boot (Java)
├── ai-monitor/        # Python + OpenCV + MediaPipe
├── docker/            # Docker Compose setup
└── docs/              # Documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, TypeScript |
| Backend | Spring Boot, Spring Security, JWT |
| AI Module | Python, OpenCV, MediaPipe, TensorFlow |
| Database | PostgreSQL |
| Email | Spring Mail (SMTP) |
| Compiler | Judge0 API |

## Quick Start

### Prerequisites
- Node.js 18+
- Java 17+
- Python 3.9+
- PostgreSQL 14+
- Docker & Docker Compose

### 1. Using Docker (Recommended)

```bash
cd docker
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- AI Monitor: http://localhost:5000

### 2. Manual Setup

#### Database
```bash
psql -U postgres -c "CREATE DATABASE proctoring_db;"
psql -U postgres proctoring_db < docs/schema.sql
```

#### Backend
```bash
cd backend
./mvnw spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### AI Monitor
```bash
cd ai-monitor
pip install -r requirements.txt
python app.py
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@proctoring.com | Admin@123 |

## Features

- 🔐 JWT-based authentication
- 📝 Create coding & quiz assessments
- 📧 Email-based test invitations
- 🤖 Real-time AI proctoring (face, eye, head tracking)
- 💻 Integrated online compiler (Java, Python, C++, JS)
- 📊 Automated result evaluation
- 📋 Detailed proctoring violation reports
- 🛡️ Browser tab-switch detection

## API Documentation

See `docs/API.md` for full REST API reference.
