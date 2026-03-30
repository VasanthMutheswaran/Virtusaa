package com.proctoring.controller;

import com.proctoring.dto.*;
import com.proctoring.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AssessmentService assessmentService;
    private final CandidateService candidateService;
    private final ResultService resultService;
    private final ProctoringService proctoringService;

    public AdminController(AssessmentService assessmentService,
            CandidateService candidateService,
            ResultService resultService,
            ProctoringService proctoringService) {
        this.assessmentService = assessmentService;
        this.candidateService = candidateService;
        this.resultService = resultService;
        this.proctoringService = proctoringService;
    }

    // ===== ASSESSMENT ENDPOINTS =====
    @GetMapping("/assessments")
    public ResponseEntity<List<AssessmentDTO>> getAllAssessments() {
        return ResponseEntity.ok(assessmentService.getAllAssessments());
    }

    @PostMapping("/assessments")
    public ResponseEntity<AssessmentDTO> createAssessment(@RequestBody AssessmentDTO dto) {
        return ResponseEntity.ok(assessmentService.createAssessment(dto));
    }

    @GetMapping("/assessments/{id}")
    public ResponseEntity<AssessmentDTO> getAssessment(@PathVariable("id") Long id) {
        return ResponseEntity.ok(assessmentService.getAssessmentById(id));
    }

    @PutMapping("/assessments/{id}")
    public ResponseEntity<AssessmentDTO> updateAssessment(@PathVariable("id") Long id, @RequestBody AssessmentDTO dto) {
        return ResponseEntity.ok(assessmentService.updateAssessment(id, dto));
    }

    @DeleteMapping("/assessments/{id}")
    public ResponseEntity<Void> deleteAssessment(@PathVariable("id") Long id) {
        assessmentService.deleteAssessment(id);
        return ResponseEntity.noContent().build();
    }

    // ===== QUESTION ENDPOINTS =====
    @PostMapping("/assessments/{id}/coding-questions")
    public ResponseEntity<CodingQuestionDTO> addCodingQuestion(@PathVariable("id") Long id,
            @RequestBody CodingQuestionDTO dto) {
        return ResponseEntity.ok(assessmentService.addCodingQuestion(id, dto));
    }

    @PostMapping("/assessments/{id}/quiz-questions")
    public ResponseEntity<QuizQuestionDTO> addQuizQuestion(@PathVariable("id") Long id,
            @RequestBody QuizQuestionDTO dto) {
        return ResponseEntity.ok(assessmentService.addQuizQuestion(id, dto));
    }

    @PostMapping("/generate-from-pdf")
    public ResponseEntity<?> generateFromPdf(@RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "count", defaultValue = "5") int count,
            @RequestParam(value = "difficulty", defaultValue = "MEDIUM") String difficulty,
            @RequestParam(value = "type", defaultValue = "both") String type) {
        return ResponseEntity.ok(assessmentService.generateQuestionsFromPdf(file, count, difficulty, type));
    }

    @PostMapping("/suggest-questions")
    public ResponseEntity<?> suggestQuestions(
            @RequestParam(value = "difficulty", defaultValue = "MEDIUM") String difficulty,
            @RequestParam(value = "type", defaultValue = "both") String type,
            @RequestParam(value = "count", defaultValue = "3") int count,
            @RequestParam(value = "topic", defaultValue = "general computer science") String topic) {
        return ResponseEntity.ok(assessmentService.suggestQuestions(difficulty, type, count, topic));
    }

    @PostMapping("/assessments/test-upload")
    public ResponseEntity<String> testUpload(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        System.out.println(
                "DEBUG: Test Upload Success! File: " + file.getOriginalFilename() + " Size: " + file.getSize());
        return ResponseEntity.ok("Received: " + file.getOriginalFilename());
    }

    // ===== CANDIDATE ENDPOINTS =====
    @GetMapping("/candidates")
    public ResponseEntity<List<CandidateDTO>> getAllCandidates() {
        return ResponseEntity.ok(candidateService.getAllCandidates());
    }

    @PostMapping("/candidates")
    public ResponseEntity<CandidateDTO> addCandidate(@RequestBody CandidateDTO dto) {
        return ResponseEntity.ok(candidateService.addCandidate(dto));
    }

    @DeleteMapping("/candidates/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable("id") Long id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/assessments/{assessmentId}/invite")
    public ResponseEntity<String> inviteCandidates(@PathVariable("assessmentId") Long assessmentId,
            @RequestBody List<Long> candidateIds) {
        assessmentService.inviteCandidates(assessmentId, candidateIds);
        return ResponseEntity.ok("Invitations sent successfully");
    }

    // ===== RESULTS & PROCTORING =====
    @GetMapping("/assessments/{id}/results")
    public ResponseEntity<List<ResultDTO>> getResults(@PathVariable("id") Long id) {
        return ResponseEntity.ok(resultService.getResultsByAssessment(id));
    }

    @GetMapping("/results")
    public ResponseEntity<List<ResultDTO>> getGlobalResults() {
        return ResponseEntity.ok(resultService.getAllResults());
    }

    @GetMapping("/sessions/{sessionId}/proctoring-logs")
    public ResponseEntity<List<ProctoringLogDTO>> getProctoringLogs(@PathVariable("sessionId") Long sessionId) {
        return ResponseEntity.ok(resultService.getProctoringLogs(sessionId));
    }

    @PostMapping("/results/{sessionId}/verdict")
    public ResponseEntity<ResultDTO> updateVerdict(@PathVariable("sessionId") Long sessionId,
            @RequestBody VerdictRequestDTO dto) {
        return ResponseEntity.ok(resultService.updateVerdictAndNotify(sessionId, dto.getVerdict()));
    }

    @DeleteMapping("/results/{sessionId}")
    public ResponseEntity<Void> deleteResult(@PathVariable("sessionId") Long sessionId) {
        resultService.deleteResult(sessionId);
        return ResponseEntity.noContent().build();
    }

    // ===== LIVE STATS =====
    @GetMapping("/stats/violations")
    public ResponseEntity<Map<String, Long>> getViolationStats() {
        return ResponseEntity.ok(proctoringService.getGlobalViolationStats());
    }
}
