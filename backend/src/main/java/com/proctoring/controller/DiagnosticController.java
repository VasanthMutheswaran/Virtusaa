package com.proctoring.controller;

import com.proctoring.model.AssessmentCandidate;
import com.proctoring.repository.AssessmentCandidateRepository;
import com.proctoring.repository.CodingQuestionRepository;
import com.proctoring.repository.QuizQuestionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
public class DiagnosticController {

    private final AssessmentCandidateRepository acRepo;
    private final CodingQuestionRepository cqRepo;
    private final QuizQuestionRepository qqRepo;

    @Value("${ai.monitor.url:http://localhost:5000}")
    private String aiMonitorUrl;

    @PersistenceContext
    private EntityManager entityManager;

    public DiagnosticController(AssessmentCandidateRepository acRepo,
            CodingQuestionRepository cqRepo,
            QuizQuestionRepository qqRepo) {
        this.acRepo = acRepo;
        this.cqRepo = cqRepo;
        this.qqRepo = qqRepo;
    }

    @Transactional
    @GetMapping("/fix-db")
    public String fixDatabase() {
        try {
            entityManager.createNativeQuery("ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check")
                    .executeUpdate();
            entityManager.createNativeQuery(
                    "ALTER TABLE candidates ADD CONSTRAINT candidates_status_check CHECK (status IN ('PENDING', 'INVITED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'))")
                    .executeUpdate();
            return "Database constraint candidates_status_check updated successfully!";
        } catch (Exception e) {
            return "Failed to fix database: " + e.getMessage();
        }
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        try {
            List<AssessmentCandidate> all = acRepo.findAll();
            return Map.of(
                    "serverTime", LocalDateTime.now().toString(),
                    "aiMonitorUrl", aiMonitorUrl,
                    "totalTokens", all.size(),
                    "details", all.stream().map(ac -> {
                        try {
                            Long aId = ac.getAssessment().getId();
                            return Map.of(
                                    "candidate", ac.getCandidate().getEmail(),
                                    "token", ac.getTestToken(),
                                    "assessment", ac.getAssessment().getTitle(),
                                    "codingCount", cqRepo.findByAssessmentId(aId).size(),
                                    "quizCount", qqRepo.findByAssessmentId(aId).size(),
                                    "isExpired", ac.getTokenExpiresAt().isBefore(LocalDateTime.now()),
                                    "expiresAt", ac.getTokenExpiresAt().toString());
                        } catch (Exception e) {
                            return Map.of("error", "Error mapping AC: " + e.getMessage());
                        }
                    }).collect(Collectors.toList()));
        } catch (Exception e) {
            return Map.of("error", "Global error: " + e.getMessage());
        }
    }
}
