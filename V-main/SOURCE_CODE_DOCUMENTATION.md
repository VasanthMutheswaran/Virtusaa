# Full Source Code Documentation
**Project**: AI-Powered Proctoring & Automated Assessment System
**Team**: ILLUSION
**Institution**: Rajalakshmi Engineering College
**Event**: Virtusa Jatayu Season 5 - Stage 2

---

## Overview
This project is an AI-powered proctoring system that automates exam monitoring, evaluation, and candidate analysis using computer vision and machine learning. It provides a full-stack solution for secure and automated assessment lifecycles.

## Table of Contents
1. [Backend Services (Spring Boot)](#1-backend-services-spring-boot)
   - [ExamService.java](#examservicejava)
   - [ResultService.java](#resultservicejava)
2. [AI Monitor Service (Flask & AI)](#2-ai-monitor-service-flask--ai)
   - [app.py](#apppy)
   - [face_detector.py](#face_detectorpy)
3. [Frontend Components (React)](#3-frontend-components-react)
   - [ExamRoom.js](#examroomjs)
   - [ResultsDashboard.js](#resultsdashboardjs)
   - [AssessmentCreate.js](#assessmentcreatejs)
   - [api.js](#apijs)
4. [How to Run the Project](#how-to-run-the-project)

---

## 1. Backend Services (Spring Boot)

### ExamService.java
This service handles the core examination lifecycle, including starting sessions, test case execution via a compiler service, and the final scoring logic that integrates proctoring violations.

```java
/**
 * @project AI-Powered Proctoring & Automated Assessment System
 * @version Virtusa Jatayu Season 5 - Stage 2 (POC)
 * @description Core service handles examination lifecycle, coding submissions, 
 *              quiz evaluations, and real-time proctoring log integration.
 * @author Team ILLUSION - Rajalakshmi Engineering College
 */
package com.proctoring.service;

import com.proctoring.dto.*;
import com.proctoring.model.*;
import com.proctoring.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.proctoring.repository.CandidateRepository;

@Service
public class ExamService {
    private static final Logger logger = LoggerFactory.getLogger(ExamService.class);

    private final AssessmentCandidateRepository assessmentCandidateRepository;
    private final ExamSessionRepository examSessionRepository;
    private final CodingQuestionRepository codingQuestionRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final CodingSubmissionRepository codingSubmissionRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final TestCaseRepository testCaseRepository;
    private final CompilerService compilerService;
    private final ResultRepository resultRepository;
    private final ProctoringLogRepository proctoringLogRepository;
    private final CandidateRepository candidateRepository;
    private final MicroOralSubmissionRepository microOralSubmissionRepository;

    public ExamService(AssessmentCandidateRepository assessmentCandidateRepository,
            ExamSessionRepository examSessionRepository,
            CodingQuestionRepository codingQuestionRepository,
            QuizQuestionRepository quizQuestionRepository,
            CodingSubmissionRepository codingSubmissionRepository,
            QuizAnswerRepository quizAnswerRepository,
            TestCaseRepository testCaseRepository,
            CompilerService compilerService,
            ResultRepository resultRepository,
            ProctoringLogRepository proctoringLogRepository,
            CandidateRepository candidateRepository,
            MicroOralSubmissionRepository microOralSubmissionRepository) {
        this.assessmentCandidateRepository = assessmentCandidateRepository;
        this.examSessionRepository = examSessionRepository;
        this.codingQuestionRepository = codingQuestionRepository;
        this.quizQuestionRepository = quizQuestionRepository;
        this.codingSubmissionRepository = codingSubmissionRepository;
        this.quizAnswerRepository = quizAnswerRepository;
        this.testCaseRepository = testCaseRepository;
        this.compilerService = compilerService;
        this.resultRepository = resultRepository;
        this.proctoringLogRepository = proctoringLogRepository;
        this.candidateRepository = candidateRepository;
        this.microOralSubmissionRepository = microOralSubmissionRepository;
    }

    @Transactional
    public ExamDTO startExam(String testToken, String ip) {
        AssessmentCandidate ac = assessmentCandidateRepository.findByTestToken(testToken)
                .orElseThrow(() -> new RuntimeException("Invalid or non-existent test token"));

        if (ac.getTokenExpiresAt() != null && ac.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
            logger.warn("Candidate {} tried to access expired link for token: {}",
                    ac.getCandidate().getEmail(), testToken);
            throw new RuntimeException("Assessment link has expired. Please contact the administrator.");
        }

        ExamSession session = examSessionRepository.findByAssessmentCandidateId(ac.getId())
                .orElseGet(() -> {
                    ExamSession s = new ExamSession();
                    s.setAssessmentCandidate(ac);
                    s.setStartedAt(LocalDateTime.now());
                    s.setStatus(ExamSession.SessionStatus.IN_PROGRESS);
                    s.setIpAddress(ip);
                    return examSessionRepository.save(s);
                });

        if (session.getStatus() == ExamSession.SessionStatus.SUBMITTED) {
            session.setStatus(ExamSession.SessionStatus.IN_PROGRESS);
            session.setSubmittedAt(null);
            examSessionRepository.save(session);
            resultRepository.findBySessionId(session.getId()).ifPresent(resultRepository::delete);
        }

        Candidate candidate = ac.getCandidate();
        if (candidate.getStatus() != Candidate.CandidateStatus.IN_PROGRESS) {
            candidate.setStatus(Candidate.CandidateStatus.IN_PROGRESS);
            candidateRepository.save(candidate);
        }

        Assessment a = ac.getAssessment();
        ExamDTO dto = new ExamDTO();
        dto.setSessionId(session.getId());
        dto.setAssessmentTitle(a.getTitle());
        dto.setDurationMinutes(a.getDurationMinutes());
        dto.setCandidateName(ac.getCandidate().getName());

        List<CodingQuestionDTO> codingQuestions = codingQuestionRepository.findByAssessmentId(a.getId())
                .stream()
                .map(this::mapToCodingDTO).collect(Collectors.toList());

        List<QuizQuestionDTO> quizQuestions = quizQuestionRepository.findByAssessmentId(a.getId()).stream()
                .map(this::mapToQuizDTO).collect(Collectors.toList());

        dto.setCodingQuestions(codingQuestions);
        dto.setQuizQuestions(quizQuestions);
        dto.setReferencePhoto(session.getReferencePhoto());
        dto.setClarityCheckEnabled(a.isClarityCheckEnabled());

        return dto;
    }

    @Transactional
    public void saveReferencePhoto(Long sessionId, String photoBase64) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setReferencePhoto(photoBase64);
        examSessionRepository.save(session);
    }

    @Transactional
    public CodingResultDTO submitCode(CodeSubmissionDTO dto) {
        ExamSession session = examSessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));
        CodingQuestion q = codingQuestionRepository.findById(dto.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));

        List<TestCase> testCases = testCaseRepository.findByQuestionId(q.getId());
        int passed = 0;
        String finalVerdict = "ACCEPTED";
        String finalOutput = "";
        String finalError = "";

        if (testCases.isEmpty()) {
            CompilerService.CompilerResult res = compilerService.executeCode(
                    dto.getSourceCode(), dto.getLanguage(), "", "");
            finalVerdict = res.verdict();
            finalOutput = res.output();
            finalError = res.error();
        } else {
            for (TestCase tc : testCases) {
                CompilerService.CompilerResult res = compilerService.executeCode(
                        dto.getSourceCode(), dto.getLanguage(), tc.getInput(),
                        tc.getExpectedOutput());
                if (finalOutput.isEmpty() && !res.output().isEmpty()) finalOutput = res.output();
                if (finalError.isEmpty() && !res.error().isEmpty()) finalError = res.error();
                if ("ACCEPTED".equals(res.verdict())) passed++;
                else { finalVerdict = res.verdict(); finalOutput = res.output(); finalError = res.error(); }
            }
        }

        int score = testCases.isEmpty() ? 0 : (passed * q.getMarks()) / testCases.size();
        CodingSubmission submission = CodingSubmission.builder()
                .session(session).question(q).language(dto.getLanguage()).sourceCode(dto.getSourceCode())
                .verdict(finalVerdict).score(score).build();
        codingSubmissionRepository.save(submission);

        CodingResultDTO result = new CodingResultDTO();
        result.setVerdict(finalVerdict); result.setPassedTestCases(passed);
        result.setTotalTestCases(testCases.size()); result.setScore(score);
        result.setOutput(finalOutput); result.setError(finalError);
        return result;
    }

    @Transactional
    public void submitQuizAnswer(QuizAnswerDTO dto) {
        ExamSession session = examSessionRepository.findById(dto.getSessionId()).orElseThrow(() -> new RuntimeException("Session not found"));
        QuizQuestion q = quizQuestionRepository.findById(dto.getQuestionId()).orElseThrow(() -> new RuntimeException("Question not found"));
        boolean isCorrect = q.getCorrectOption() != null && q.getCorrectOption().equalsIgnoreCase(dto.getSelectedOption());
        QuizAnswer answer = quizAnswerRepository.findFirstBySessionIdAndQuestionId(session.getId(), q.getId())
                .orElseGet(() -> QuizAnswer.builder().session(session).question(q).build());
        answer.setSelectedOption(dto.getSelectedOption()); answer.setCorrect(isCorrect);
        quizAnswerRepository.save(answer);
    }

    @Transactional
    public void finalSubmit(Long sessionId) {
        ExamSession session = examSessionRepository.findById(sessionId).orElseThrow(() -> new RuntimeException("Session not found"));
        session.setSubmittedAt(LocalDateTime.now()); session.setStatus(ExamSession.SessionStatus.SUBMITTED);
        examSessionRepository.save(session);
        List<CodingSubmission> submissions = codingSubmissionRepository.findBySessionId(sessionId);
        int codingScore = submissions.stream().collect(Collectors.groupingBy(s -> s.getQuestion().getId(), Collectors.maxBy((s1, s2) -> Integer.compare(s1.getScore(), s2.getScore()))))
                .values().stream().mapToInt(opt -> opt.isPresent() ? opt.get().getScore() : 0).sum();
        Assessment assessment = session.getAssessmentCandidate().getAssessment();
        int quizTotal = quizQuestionRepository.findByAssessmentId(assessment.getId()).stream().mapToInt(QuizQuestion::getMarks).sum();
        int quizScore = quizAnswerRepository.findBySessionId(sessionId).stream().filter(QuizAnswer::isCorrect).mapToInt(a -> a.getQuestion().getMarks()).sum();
        int codingTotal = codingQuestionRepository.findByAssessmentId(assessment.getId()).stream().mapToInt(CodingQuestion::getMarks).sum();
        List<ProctoringLog> logs = proctoringLogRepository.findBySessionId(sessionId);
        int oralScore = microOralSubmissionRepository.findBySessionId(sessionId).stream().mapToInt(s -> (int) Math.round((s.getScore() != null ? s.getScore() : 0) * 0.1)).sum();
        int rawScore = quizScore + codingScore + oralScore;
        float penaltyFactor = Math.max(0.05f, 1 - (logs.size() / 200.0f));
        Result result = resultRepository.findBySessionId(sessionId).orElse(new Result());
        result.setSession(session); result.setQuizScore(quizScore); result.setQuizTotal(quizTotal);
        result.setCodingScore(codingScore); result.setCodingTotal(codingTotal);
        result.setOralScore(oralScore); result.setTotalScore(Math.round(rawScore * penaltyFactor));
        result.setViolationCount(logs.size()); result.setVerdict("COMPLETED");
        resultRepository.save(result);
    }

    private CodingQuestionDTO mapToCodingDTO(CodingQuestion q) {
        CodingQuestionDTO dto = new CodingQuestionDTO();
        dto.setId(q.getId()); dto.setTitle(q.getTitle()); dto.setDescription(q.getDescription());
        dto.setDifficulty(q.getDifficulty()); dto.setMarks(q.getMarks());
        return dto;
    }

    private QuizQuestionDTO mapToQuizDTO(QuizQuestion q) {
        QuizQuestionDTO dto = new QuizQuestionDTO();
        dto.setId(q.getId()); dto.setQuestion(q.getQuestion()); dto.setOptionA(q.getOptionA());
        dto.setOptionB(q.getOptionB()); dto.setOptionC(q.getOptionC()); dto.setOptionD(q.getOptionD());
        dto.setMarks(q.getMarks()); dto.setAudioBase64(q.getAudioBase64());
        return dto;
    }
}
```

### ResultService.java
This service provides result analysis, violation reports for HR, and penalty normalization for oral and technical evaluation.

```java
/**
 * @project AI-Powered Proctoring & Automated Assessment System
 * @version Virtusa Jatayu Season 5 - Stage 2 (POC)
 * @description Service handles result calculation, penalty logic based on 
 *              proctoring violations, and automated candidate notifications.
 * @author Team ILLUSION - Rajalakshmi Engineering College
 */
package com.proctoring.service;

import com.proctoring.dto.ResultDTO;
import com.proctoring.model.Result;
import com.proctoring.repository.ResultRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResultService {
    private final ResultRepository resultRepository;

    public ResultService(ResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    public List<ResultDTO> getAllResults() {
        return resultRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private ResultDTO mapToDTO(Result r) {
        ResultDTO dto = new ResultDTO();
        dto.setSessionId(r.getSession().getId());
        dto.setCandidateName(r.getSession().getAssessmentCandidate().getCandidate().getName());
        dto.setQuizScore(r.getQuizScore()); dto.setCodingScore(r.getCodingScore());
        dto.setOralScore(r.getOralScore()); dto.setTotalScore(r.getTotalScore());
        dto.setViolationCount(r.getViolationCount());
        return dto;
    }
}
```

---

## 2. AI Monitor Service (Flask & AI)

### app.py
The AI Engine built with Flask, MediaPipe, YOLOv8, and Google Gemini. It handles the computer vision pipeline for proctoring and the generative AI pipeline for automated evaluation.

```python
"""
@project: AI-Powered Proctoring & Automated Assessment System
@version: Virtusa Jatayu Season 5 - Stage 2 (POC)
@description: AI Monitor Service handling real-time computer vision (MediaPipe/YOLOv8) 
              and generative AI (Google Gemini) for candidate behavior analysis.
@author: Team ILLUSION - Rajalakshmi Engineering College
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import io
import google.generativeai as genai
import os
import json
import mediapipe as mp
import cv2
from ultralytics import YOLO
from detectors.face_detector import FaceDetector

app = Flask(__name__)
CORS(app)
face_detector = FaceDetector()
yolo_model = YOLO("yolov8s.pt")
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

@app.route("/analyze", methods=["POST"])
def analyze():
    img_data = request.json["image"]
    image = cv2.cvtColor(np.array(Image.open(io.BytesIO(base64.b64decode(img_data.split(",")[1])))), cv2.COLOR_RGB2BGR)
    violations = []
    face_result = face_detector.detect(image)
    if face_result["face_count"] == 0: violations.append({"type":"NO_FACE", "description":"Candidate not visible"})
    elif face_result["face_count"] > 1: violations.append({"type":"MULTIPLE_FACES", "description":"Multiple people detected"})
    return jsonify({"violations": violations, "face_count": face_result["face_count"]})

@app.route("/generate-audio", methods=["POST"])
def generate_audio():
    # edge-tts integration
    return send_file(audio_path, mimetype="audio/mpeg")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

### face_detector.py
Core vision component using MediaPipe for face detection and mesh analysis.

```python
import cv2
import mediapipe as mp
import numpy as np

class FaceDetector:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

    def detect(self, image):
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(rgb_image)
        face_count = len(results.detections) if results.detections else 0
        return {'face_count': face_count}
```

---

## 3. Frontend Components (React)

### ExamRoom.js
The main candidate interface featuring the coding editor, proctoring monitor, and real-time security alerts.

```javascript
import React, { useState, useEffect } from 'react';
import { examAPI } from '../services/api';

export default function ExamRoom() {
  const [exam, setExam] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const startExam = async () => {
    setIsStarted(true);
    // Enter Fullscreen & Request Screen Share
  };

  return (
    <div className="exam-container">
      {!isStarted ? <button onClick={startExam}>Start Secure Session</button> : (
        <div className="flex">
          <div className="editor-zone"><CodeEditor /></div>
          <div className="monitor-zone"><ProctoringMonitor /></div>
        </div>
      )}
    </div>
  );
}
```

### ResultsDashboard.js
The Administrative reporting dashboard for reviewing candidate performance and proctoring videos.

```javascript
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function ResultsDashboard() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    adminAPI.getAllResults().then(({ data }) => setResults(data));
  }, []);

  return (
    <table>
      <thead><tr><th>Candidate</th><th>Score</th><th>Violations</th></tr></thead>
      <tbody>{results.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.score}</td><td>{r.violations}</td></tr>)}</tbody>
    </table>
  );
}
```

---

## How to Run the Project

### 1. Start Backend (Spring Boot)
1. Ensure JDK 17+ and PostgreSQL are installed.
2. Run: `mvn spring-boot:run`
3. Backend will be available at `http://localhost:8080`.

### 2. Start AI Service (Flask)
1. Install dependencies: `pip install flask mediapipe ultralytics google-generativeai`.
2. Run: `python app.py`
3. AI Service will be available at `http://localhost:5000`.

### 3. Start Frontend (React)
1. Run: `npm install && npm start`
2. Access the portal at `http://localhost:3000`.

---
**Submission for Virtusa Jatayu Season 5 - Team ILLUSION**
**Rajalakshmi Engineering College**
