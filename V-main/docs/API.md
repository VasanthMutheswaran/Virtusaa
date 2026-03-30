# AI Proctoring Platform - API Reference

Base URL: `http://localhost:8080/api`

## Authentication

### Admin Login
`POST /auth/admin/login`
```json
{ "email": "admin@proctoring.com", "password": "Admin@123" }
```
Response: `{ "token": "JWT_TOKEN", "role": "ADMIN", "name": "Super Admin", "id": 1 }`

### Candidate Token Verification
`POST /auth/candidate/verify?token={TEST_TOKEN}`
Response: `{ "token": "JWT_TOKEN", "role": "CANDIDATE" }`

---
## Admin Endpoints (requires Bearer token)

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/assessments` | List all assessments |
| POST | `/admin/assessments` | Create assessment |
| GET | `/admin/assessments/{id}` | Get assessment details |
| PUT | `/admin/assessments/{id}` | Update assessment |
| DELETE | `/admin/assessments/{id}` | Delete assessment |
| POST | `/admin/assessments/{id}/coding-questions` | Add coding question |
| POST | `/admin/assessments/{id}/quiz-questions` | Add quiz question |
| POST | `/admin/assessments/{id}/invite` | Invite candidates |
| GET | `/admin/assessments/{id}/results` | Get results |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/candidates` | List all candidates |
| POST | `/admin/candidates` | Add candidate |

### Proctoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/sessions/{sessionId}/proctoring-logs` | Get violation logs |

---
## Candidate Exam Endpoints (no auth - token-based)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/candidate/exam/start/{token}` | Start exam, get questions |
| POST | `/candidate/exam/submit/coding` | Submit code for evaluation |
| POST | `/candidate/exam/submit/quiz` | Save quiz answer |
| POST | `/candidate/exam/submit/final/{sessionId}` | Final exam submission |
| POST | `/candidate/exam/proctoring/log` | Log violation event |

---
## AI Monitor Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/analyze` | Analyze webcam frame |

### Analyze Request
```json
{
  "image": "base64_encoded_jpeg",
  "sessionId": 123
}
```
### Analyze Response
```json
{
  "violations": [
    {
      "type": "MULTIPLE_FACES",
      "severity": "HIGH",
      "description": "2 faces detected"
    }
  ],
  "face_count": 2
}
```

---
## Data Models

### Assessment Statuses: `DRAFT | ACTIVE | COMPLETED | ARCHIVED`
### Violation Types: `MULTIPLE_FACES | NO_FACE | TAB_SWITCH | LOOKING_AWAY | SUSPICIOUS_MOVEMENT | PHONE_DETECTED`
### Severity Levels: `LOW | MEDIUM | HIGH`
### Verdict: `SELECTED | REJECTED | REVIEW | PENDING`
