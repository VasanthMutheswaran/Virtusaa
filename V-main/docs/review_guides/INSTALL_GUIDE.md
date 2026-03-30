# 🛠️ Team Setup & Installation Guide

Follow these steps to run the **AI Proctoring Platform** on your local machine without errors.

---

## 📋 Prerequisites
Ensure you have the following installed:
*   **Java 17+** (JDK)
*   **Node.js 18+** & **npm**
*   **Python 3.9+**
*   **PostgreSQL 14+**
*   **Maven** (or use the included `./mvnw`)

---

## 1. 💾 Database Setup (PostgreSQL)
1. Open your PostgreSQL terminal (pgAdmin or psql).
2. Create the database:
   ```sql
   CREATE DATABASE proctoring_db;
   ```
3. The tables will be created automatically by Hibernate when you start the backend.

---

## 2. ⚙️ Backend Configuration
1. Navigate to `backend/src/main/resources/application.properties`.
2. Update the database credentials if yours are different:
   ```properties
   spring.datasource.username=postgres
   spring.datasource.password=1234
   ```
3. **Important**: Ensure the `jwt.secret` is long and secure (the default is fine for local testing).

---

## 3. 🤖 AI Monitor Setup (Python)
1. Navigate to the `ai-monitor` folder.
2. Create a virtual environment (Recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. **Gemini API Key**: Set your API key as an environment variable:
   ```bash
   # Windows (PowerShell)
   $env:GEMINI_API_KEY="AIzaSyBWSkYp1jN3z1WNImJeCw_CdKrDnwsOzE0"
   ```

---

## 4. 🌐 Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🚀 Running the Project
You need to have **three terminals** open to run everything at once:

### **Terminal 1: Backend**
```bash
cd backend

# Option A: Windows Fail-safe (Absolute Path)
& "C:\Users\laksh\.m2\wrapper\dists\apache-maven-3.9.12-bin\5nmfsn99br87k5d4ajlekdq10k\apache-maven-3.9.12\bin\mvn.cmd" spring-boot:run

# Option B: Standard Windows PowerShell
.\mvnw spring-boot:run

# Option C: Global Maven (if installed)
mvn spring-boot:run
```

### **Terminal 2: AI Module**
```bash
cd ai-monitor
python app.py
```

### **Terminal 3: Frontend**
```bash
cd frontend
npm start
```

---

## 💡 Troubleshooting
*   **Port 8080/3000 busy?**: Check if another instance of the app is running.
*   **Database connection fails?**: Ensure PostgreSQL service is running and the `proctoring_db` exists.
*   **AI Monitor connection?**: Make sure `app.py` is running on `http://localhost:5000` before trying to generate assessments.
