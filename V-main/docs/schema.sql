-- AI Proctoring Platform Database Schema

CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_by BIGINT REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coding_questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT REFERENCES assessments(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'MEDIUM',
    marks INT DEFAULT 10,
    time_limit_seconds INT DEFAULT 2,
    memory_limit_mb INT DEFAULT 256,
    sample_input TEXT,
    sample_output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_cases (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT REFERENCES coding_questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT REFERENCES assessments(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_option CHAR(1) NOT NULL,
    marks INT DEFAULT 1,
    topic VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS assessment_candidates (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT REFERENCES assessments(id),
    candidate_id BIGINT REFERENCES candidates(id),
    test_token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMP,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS exam_sessions (
    id BIGSERIAL PRIMARY KEY,
    assessment_candidate_id BIGINT REFERENCES assessment_candidates(id),
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    ip_address VARCHAR(50),
    browser_info TEXT
);

CREATE TABLE IF NOT EXISTS coding_submissions (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES exam_sessions(id),
    question_id BIGINT REFERENCES coding_questions(id),
    language VARCHAR(30) NOT NULL,
    source_code TEXT NOT NULL,
    verdict VARCHAR(50),
    score INT DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES exam_sessions(id),
    question_id BIGINT REFERENCES quiz_questions(id),
    selected_option CHAR(1),
    is_correct BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proctoring_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES exam_sessions(id),
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'LOW',
    description TEXT,
    screenshot_url VARCHAR(500),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES exam_sessions(id) UNIQUE,
    quiz_score INT DEFAULT 0,
    quiz_total INT DEFAULT 0,
    coding_score INT DEFAULT 0,
    coding_total INT DEFAULT 0,
    total_score INT DEFAULT 0,
    violation_count INT DEFAULT 0,
    verdict VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed admin
INSERT INTO admins (name, email, password) VALUES
('Super Admin', 'admin@proctoring.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT DO NOTHING;
-- Password is: Admin@123
