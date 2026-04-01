package com.proctoring.service;

import com.proctoring.dto.*;
import com.proctoring.model.*;
import com.proctoring.repository.*;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AssessmentService {
    private static final Logger logger = LoggerFactory.getLogger(AssessmentService.class);

    private final AssessmentRepository assessmentRepository;
    private final CodingQuestionRepository codingQuestionRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final CandidateRepository candidateRepository;
    private final AssessmentCandidateRepository assessmentCandidateRepository;
    private final EmailService emailService;
    private final org.springframework.web.client.RestTemplate restTemplate;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${ai.monitor.url:http://localhost:5000}")
    private String aiMonitorUrl;

    public AssessmentService(AssessmentRepository assessmentRepository,
            CodingQuestionRepository codingQuestionRepository,
            QuizQuestionRepository quizQuestionRepository,
            CandidateRepository candidateRepository,
            AssessmentCandidateRepository assessmentCandidateRepository,
            EmailService emailService,
            org.springframework.web.client.RestTemplate restTemplate) {
        this.assessmentRepository = assessmentRepository;
        this.codingQuestionRepository = codingQuestionRepository;
        this.quizQuestionRepository = quizQuestionRepository;
        this.candidateRepository = candidateRepository;
        this.assessmentCandidateRepository = assessmentCandidateRepository;
        this.emailService = emailService;
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> generateQuestionsFromPdf(org.springframework.web.multipart.MultipartFile file,
            int count, String difficulty, String type) {
        try {
            System.out.println(
                    "DEBUG: AssessmentService processing: " + file.getOriginalFilename() + " with count: " + count
                            + ", diff: " + difficulty + ", type: " + type);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA);

            org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();

            // This is the most reliable way to pass a file between Spring services
            org.springframework.core.io.Resource fileResource = file.getResource();
            body.add("file", fileResource);
            body.add("count", String.valueOf(count));
            body.add("difficulty", difficulty);
            body.add("type", type);

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(
                    body, headers);

            String url = aiMonitorUrl + "/generate";
            System.out.println("DEBUG: POSTing to AI Service: " + url);

            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {
            };
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.POST, requestEntity, responseType);
            Map<String, Object> result = response.getBody();
            System.out.println("DEBUG: AI Service response: " + (result != null ? "SUCCESS" : "NULL"));

            return result;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            System.out.println("DEBUG: AI Service Error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
            throw new RuntimeException("AI Logic Error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            System.out.println("DEBUG: Unexpected Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Generation failed: " + e.getMessage());
        }
    }

    public Map<String, Object> suggestQuestions(String difficulty, String type, int count, String topic) {
        try {
            logger.info("Requesting AI suggestions: diff={}, type={}, count={}, topic={}", difficulty, type, count,
                    topic);
            Map<String, Object> payload = Map.of(
                    "difficulty", difficulty,
                    "type", type,
                    "count", count,
                    "topic", topic);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            org.springframework.http.HttpEntity<Map<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(
                    payload, headers);

            String url = aiMonitorUrl + "/suggest";

            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {
            };
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.POST, requestEntity, responseType);

            Map<String, Object> body = response.getBody();
            System.out.println("DEBUG: AI Suggestion response: " + (body != null ? "SUCCESS" : "NULL"));
            if (body != null) {
                System.out.println("DEBUG: AI Suggestion detail: Quiz=" + ((List) body.get("quizQuestions")).size()
                        + ", Coding=" + ((List) body.get("codingQuestions")).size());
            }

            return body;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logger.error("AI Suggestion Service Error ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of("quizQuestions", List.of(), "codingQuestions", List.of(), "error",
                    e.getResponseBodyAsString());
        } catch (Exception e) {
            logger.error("AI Suggestion failed unexpectedly: {}", e.getMessage(), e);
            return Map.of("quizQuestions", List.of(), "codingQuestions", List.of(), "error", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AssessmentDTO> getAllAssessments() {
        return assessmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssessmentDTO createAssessment(AssessmentDTO dto) {
        Assessment.AssessmentStatus status = Assessment.AssessmentStatus.DRAFT;
        if (dto.getStatus() != null) {
            try {
                status = Assessment.AssessmentStatus.valueOf(dto.getStatus());
            } catch (IllegalArgumentException e) {
                // Keep default DRAFT
            }
        }

        Assessment assessment = Assessment.builder()
                .title(dto.getTitle() != null && !dto.getTitle().isEmpty() ? dto.getTitle() : "Untitled Assessment")
                .description(dto.getDescription())
                .durationMinutes(dto.getDurationMinutes() > 0 ? dto.getDurationMinutes() : 60)
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(status)
                .clarityCheckEnabled(dto.isClarityCheckEnabled())
                .build();
        return mapToDTO(assessmentRepository.save(assessment));
    }

    @Transactional(readOnly = true)
    public AssessmentDTO getAssessmentById(Long id) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));
        return mapToDTO(assessment);
    }

    @Transactional
    public AssessmentDTO updateAssessment(Long id, AssessmentDTO dto) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));
        assessment.setTitle(dto.getTitle());
        assessment.setDescription(dto.getDescription());
        assessment.setDurationMinutes(dto.getDurationMinutes());
        assessment.setStartTime(dto.getStartTime());
        assessment.setEndTime(dto.getEndTime());
        assessment.setStatus(Assessment.AssessmentStatus.valueOf(dto.getStatus()));
        return mapToDTO(assessmentRepository.save(assessment));
    }

    public void deleteAssessment(Long id) {
        assessmentRepository.deleteById(id);
    }

    @Transactional
    public CodingQuestionDTO addCodingQuestion(Long assessmentId, CodingQuestionDTO dto) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        logger.info("Adding coding question to assessment ID: {}", assessmentId);
        CodingQuestion question = CodingQuestion.builder()
                .assessment(assessment)
                .title(dto.getTitle() != null && !dto.getTitle().isEmpty() ? dto.getTitle() : "Untitled Question")
                .description(dto.getDescription() != null && !dto.getDescription().isEmpty() ? dto.getDescription()
                        : "No description")
                .difficulty(dto.getDifficulty() != null ? dto.getDifficulty() : "MEDIUM")
                .marks(dto.getMarks() > 0 ? dto.getMarks() : 10)
                .timeLimitSeconds(dto.getTimeLimitSeconds() > 0 ? dto.getTimeLimitSeconds() : 2)
                .memoryLimitMb(dto.getMemoryLimitMb() > 0 ? dto.getMemoryLimitMb() : 256)
                .sampleInput(dto.getSampleInput() != null ? dto.getSampleInput() : "")
                .sampleOutput(dto.getSampleOutput() != null ? dto.getSampleOutput() : "")
                .build();

        if (dto.getTestCases() != null && !dto.getTestCases().isEmpty()) {
            List<TestCase> tcs = dto.getTestCases().stream().map(tcDto -> {
                TestCase tc = new TestCase();
                tc.setQuestion(question);
                tc.setInput(tcDto.getInput() != null ? tcDto.getInput() : "");
                tc.setExpectedOutput(tcDto.getExpectedOutput() != null ? tcDto.getExpectedOutput() : "");
                tc.setHidden(tcDto.isHidden());
                return tc;
            }).collect(Collectors.toList());
            question.setTestCases(tcs);
            logger.info("Associated {} test cases with coding question", tcs.size());
        }

        CodingQuestion saved = codingQuestionRepository.save(question);
        logger.info("Saved coding question with ID: {}", saved.getId());
        return mapToCodingDTO(saved);
    }

    @Transactional
    public QuizQuestionDTO addQuizQuestion(Long assessmentId, QuizQuestionDTO dto) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        logger.info("Adding quiz question to assessment ID: {}", assessmentId);
        QuizQuestion question = QuizQuestion.builder()
                .assessment(assessment)
                .question(dto.getQuestion())
                .optionA(dto.getOptionA() != null ? dto.getOptionA() : "")
                .optionB(dto.getOptionB() != null ? dto.getOptionB() : "")
                .optionC(dto.getOptionC() != null ? dto.getOptionC() : "")
                .optionD(dto.getOptionD() != null ? dto.getOptionD() : "")
                .correctOption(dto.getCorrectOption() != null ? dto.getCorrectOption() : "A")
                .marks(dto.getMarks() > 0 ? dto.getMarks() : 1)
                .topic(dto.getTopic() != null ? dto.getTopic() : "General")
                .sectionName(dto.getSectionName() != null ? dto.getSectionName() : "General")
                .audioBase64(dto.getAudioBase64())
                .build();

        QuizQuestion saved = quizQuestionRepository.save(question);
        logger.info("Saved quiz question with ID: {}", saved.getId());
        return mapToQuizDTO(saved);
    }

    @Transactional
    public void inviteCandidates(Long assessmentId, List<Long> candidateIds) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        if (assessment.getStatus() == Assessment.AssessmentStatus.DRAFT) {
            assessment.setStatus(Assessment.AssessmentStatus.ACTIVE);
            assessmentRepository.save(assessment);
        }

        String yearSuffix = String.valueOf(LocalDateTime.now().getYear()).substring(2);

        for (Long candidateId : candidateIds) {
            Candidate candidate = candidateRepository.findById(candidateId)
                    .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));

            Optional<AssessmentCandidate> existing = assessmentCandidateRepository
                    .findByAssessmentIdAndCandidateId(assessmentId, candidateId);

            AssessmentCandidate ac;
            if (existing.isPresent()) {
                ac = existing.get();
                ac.setTokenExpiresAt(LocalDateTime.now().plusDays(7));
            } else {
                ac = new AssessmentCandidate();
                ac.setAssessment(assessment);
                ac.setCandidate(candidate);
                ac.setTestToken(UUID.randomUUID().toString());
                ac.setTokenExpiresAt(LocalDateTime.now().plusDays(7));
            }

            // Ensure credentials are generated
            String finalUsername = ac.getUsername();
            if (finalUsername == null || finalUsername.trim().isEmpty()) {
                // BUG FIX: Use full ID to avoid collisions (previously candidateId % 100)
                finalUsername = "CA" + yearSuffix + String.format("%04d", candidateId);

                // Double check for existence (extremely rare now but safe)
                int counter = 1;
                while (assessmentCandidateRepository.findByUsername(finalUsername).isPresent()) {
                    finalUsername = "CA" + yearSuffix + String.format("%04d", candidateId) + "_" + counter++;
                }
                ac.setUsername(finalUsername);
            }
            String finalPassword = ac.getPassword();
            if (finalPassword == null || finalPassword.trim().isEmpty()) {
                finalPassword = generateRandomPassword();
                ac.setPassword(finalPassword);
            }

            try {
                assessmentCandidateRepository.saveAndFlush(ac);
            } catch (Exception e) {
                logger.error("CRITICAL: Failed to save assessment candidate record for {}: {}", candidate.getEmail(),
                        e.getMessage());
                throw new RuntimeException(
                        "Database error while inviting " + candidate.getEmail() + ": " + e.getMessage());
            }

            if (candidate.getStatus() == Candidate.CandidateStatus.PENDING) {
                candidate.setStatus(Candidate.CandidateStatus.INVITED);
                candidateRepository.save(candidate);
            }

            try {
                logger.info("FINAL CHECK - Invitation for: {} | Username: {} | Password: {}",
                        candidate.getEmail(), finalUsername, finalPassword);

                emailService.sendTestInvitation(
                        candidate.getEmail(),
                        candidate.getName(),
                        assessment.getTitle(),
                        finalUsername,
                        finalPassword,
                        frontendUrl);
            } catch (Exception e) {
                // Email is async, so this catch only handles submission failures
                logger.error("Failed to submit email task for {}: {}", candidate.getEmail(), e.getMessage());
            }
        }
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private AssessmentDTO mapToDTO(Assessment a) {
        AssessmentDTO dto = new AssessmentDTO();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setDescription(a.getDescription());
        dto.setDurationMinutes(a.getDurationMinutes());
        dto.setStartTime(a.getStartTime());
        dto.setEndTime(a.getEndTime());
        dto.setStatus(a.getStatus().name());
        dto.setTotalCodingQuestions(a.getCodingQuestions() != null ? a.getCodingQuestions().size() : 0);
        dto.setTotalQuizQuestions(a.getQuizQuestions() != null ? a.getQuizQuestions().size() : 0);
        dto.setClarityCheckEnabled(a.isClarityCheckEnabled());
        return dto;
    }

    private CodingQuestionDTO mapToCodingDTO(CodingQuestion q) {
        CodingQuestionDTO dto = new CodingQuestionDTO();
        dto.setId(q.getId());
        dto.setAssessmentId(q.getAssessment().getId());
        dto.setTitle(q.getTitle());
        dto.setDescription(q.getDescription());
        dto.setDifficulty(q.getDifficulty());
        dto.setMarks(q.getMarks());
        dto.setTimeLimitSeconds(q.getTimeLimitSeconds());
        dto.setMemoryLimitMb(q.getMemoryLimitMb());
        dto.setSampleInput(q.getSampleInput());
        dto.setSampleOutput(q.getSampleOutput());
        if (q.getTestCases() != null) {
            dto.setTestCases(q.getTestCases().stream().map(tc -> {
                TestCaseDTO tcDto = new TestCaseDTO();
                tcDto.setInput(tc.getInput());
                tcDto.setExpectedOutput(tc.getExpectedOutput());
                return tcDto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }

    private QuizQuestionDTO mapToQuizDTO(QuizQuestion q) {
        QuizQuestionDTO dto = new QuizQuestionDTO();
        dto.setId(q.getId());
        dto.setAssessmentId(q.getAssessment().getId());
        dto.setQuestion(q.getQuestion());
        dto.setOptionA(q.getOptionA());
        dto.setOptionB(q.getOptionB());
        dto.setOptionC(q.getOptionC());
        dto.setOptionD(q.getOptionD());
        dto.setCorrectOption(q.getCorrectOption());
        dto.setMarks(q.getMarks());
        dto.setTopic(q.getTopic());
        dto.setSectionName(q.getSectionName());
        dto.setAudioBase64(q.getAudioBase64());
        return dto;
    }
}
