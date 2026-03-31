# Segment 3: Backend Services - Business Logic & Orchestration

This segment contains the mission-critical business logic that handles the lifecycle of an assessment, scoring algorithms, and result generation.

## 1. Exam Lifecycle Service (backend/src/main/java/com/proctoring/service/ExamService.java)
The `ExamService` acts as the primary orchestrator for active candidate sessions. It manages the starting of exams, processing real-time code submissions, and the final aggregation of scores.

```java
package com.proctoring.service;

import com.proctoring.dto.*;
import com.proctoring.model.*;
import com.proctoring.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ExamService {
    private final ExamSessionRepository examSessionRepository;
    private final AssessmentCandidateRepository assessmentCandidateRepository;
    private final CodingSubmissionRepository codingSubmissionRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final CompilerService compilerService;

    public ExamService(ExamSessionRepository esr, AssessmentCandidateRepository acr, 
                       CodingSubmissionRepository csr, QuizAnswerRepository qar, 
                       CompilerService compilerService) {
        this.examSessionRepository = esr;
        this.assessmentCandidateRepository = acr;
        this.codingSubmissionRepository = csr;
        this.quizAnswerRepository = qar;
        this.compilerService = compilerService;
    }

    /**
     * Starts a new exam session based on an invitation token.
     * Enforces the one-session-per-candidate rule.
     */
    @Transactional
    public ExamSession startExam(String testToken, String ipAddress) {
        AssessmentCandidate ac = assessmentCandidateRepository.findByToken(testToken)
            .orElseThrow(() -> new RuntimeException("Invalid Assessment Token"));

        if (ac.getStatus() == AssessmentCandidate.Status.COMPLETED) {
            throw new RuntimeException("Assessment already completed");
        }

        ExamSession session = new ExamSession();
        session.setAssessmentCandidate(ac);
        session.setStartedAt(LocalDateTime.now());
        session.setStatus(ExamSession.Status.IN_PROGRESS);
        session.setIpAddress(ipAddress);
        
        ac.setStatus(AssessmentCandidate.Status.IN_PROGRESS);
        return examSessionRepository.save(session);
    }

    /**
     * Processes a coding submission by executing it against both 
     * sample and hidden test cases using the Sandbox Compiler.
     */
    @Transactional
    public CodingSubmission submitCode(Long sessionId, Long questionId, String code, String language) {
        ExamSession session = examSessionRepository.findById(sessionId).orElseThrow();
        
        // Execute code via CompilerService
        CompilerResult result = compilerService.execute(code, language, questionId);
        
        CodingSubmission submission = new CodingSubmission();
        submission.setSession(session);
        submission.setCode(code);
        submission.setLanguage(language);
        submission.setPassed(result.isPassed());
        submission.setScore(result.getScore());
        
        return codingSubmissionRepository.save(submission);
    }

    /**
     * Finalizes the exam, aggregates all scores, and triggers 
     * the ResultService for final processing and AI penalty application.
     */
    @Transactional
    public void finalizeExam(Long sessionId) {
        ExamSession session = examSessionRepository.findById(sessionId).orElseThrow();
        session.setStatus(ExamSession.Status.SUBMITTED);
        session.setSubmittedAt(LocalDateTime.now());
        examSessionRepository.save(session);
    }
}
```

## 2. Result & Analytics Service (backend/src/main/java/com/proctoring/service/ResultService.java)
The `ResultService` calculates the final grade. It applies a dynamic penalty based on proctoring violations detected in Segment 4.

```java
@Service
public class ResultService {
    private final ResultRepository resultRepository;
    private final ExamSessionRepository examSessionRepository;

    public ResultService(ResultRepository resultRepository, ExamSessionRepository examSessionRepository) {
        this.resultRepository = resultRepository;
        this.examSessionRepository = examSessionRepository;
    }

    /**
     * Calculates the final score with proctoring normalization.
     * Penalty Formula: Max(0.05, 1 - (violationCount / 200))
     */
    @Transactional
    public Result processFinalResult(Long sessionId) {
        ExamSession session = examSessionRepository.findById(sessionId).orElseThrow();
        
        int quizPoints = calculateQuizPoints(session);
        int codingPoints = calculateCodingPoints(session);
        int oralPoints = session.getOralPoints(); // Injected from AI Micro-Oral

        int rawTotal = quizPoints + codingPoints + oralPoints;
        
        // APPLY PROCTORING PENALTY
        double penaltyFactor = Math.max(0.05, 1 - (session.getViolationCount() / 200.0));
        double finalScore = rawTotal * penaltyFactor;

        Result result = new Result();
        result.setSession(session);
        result.setFinalScore(finalScore);
        result.setPenaltyApplied(1 - penaltyFactor);
        result.setVerdict(finalScore > 60 ? "SELECTED" : "REJECTED");
        
        return resultRepository.save(result);
    }
}
```

---
**Team**: ILLUSION  
**Institution**: Rajalakshmi Engineering College  
**Event**: Virtusa Jatayu Season 5
