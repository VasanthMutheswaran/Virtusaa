package com.proctoring.controller;

import com.proctoring.dto.*;
import com.proctoring.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/candidate/exam")
public class CandidateExamController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(CandidateExamController.class);

    private final ExamService examService;
    private final ProctoringService proctoringService;

    public CandidateExamController(ExamService examService, ProctoringService proctoringService) {
        this.examService = examService;
        this.proctoringService = proctoringService;
    }

    @GetMapping("/start/{token}")
    public ResponseEntity<ExamDTO> startExam(@PathVariable("token") String token,
            @RequestHeader(value = "X-Forwarded-For", required = false) String ip) {
        logger.info("RECEIVED START EXAM REQUEST - TOKEN: [{}], IP: {}", token, ip);
        return ResponseEntity.ok(examService.startExam(token, ip));
    }

    @PostMapping("/submit/coding")
    public ResponseEntity<CodingResultDTO> submitCode(@RequestBody CodeSubmissionDTO dto) {
        return ResponseEntity.ok(examService.submitCode(dto));
    }

    @PostMapping("/submit/quiz")
    public ResponseEntity<String> submitQuizAnswer(@RequestBody QuizAnswerDTO dto) {
        examService.submitQuizAnswer(dto);
        return ResponseEntity.ok("Answer recorded");
    }

    @PostMapping("/submit/final/{sessionId}")
    public ResponseEntity<String> submitExam(@PathVariable("sessionId") Long sessionId) {
        examService.finalSubmit(sessionId);
        return ResponseEntity.ok("Exam submitted successfully");
    }

    @PostMapping("/proctoring/log")
    public ResponseEntity<String> logViolation(@RequestBody ProctoringEventDTO dto) {
        proctoringService.logViolation(dto);
        return ResponseEntity.ok("Logged");
    }

    @PostMapping("/save-reference/{sessionId}")
    public ResponseEntity<String> saveReference(@PathVariable("sessionId") Long sessionId, @RequestBody String photoBase64) {
        examService.saveReferencePhoto(sessionId, photoBase64);
        return ResponseEntity.ok("Reference photo saved");
    }
}
