/**
 * @project AI-Powered Proctoring & Automated Assessment System
 * @version Virtusa Jatayu Season 5 - Stage 2 (POC)
 * @description Core service handles examination lifecycle, coding submissions, 
 *              quiz evaluations, and real-time proctoring log integration.
 * @author <YOUR_TEAM_NAME>
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

                // Expiry Check
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
                // Reset session for re-entry if submitted
                if (session.getStatus() == ExamSession.SessionStatus.SUBMITTED) {
                        logger.info("Session {} was SUBMITTED, resetting to IN_PROGRESS for re-entry.",
                                        session.getId());
                        session.setStatus(ExamSession.SessionStatus.IN_PROGRESS);
                        session.setSubmittedAt(null);
                        examSessionRepository.save(session);

                        // Delete old result so it appears as "active" in ResultService
                        resultRepository.findBySessionId(session.getId()).ifPresent(resultRepository::delete);
                }

                // Update candidate status
                Candidate candidate = ac.getCandidate();
                if (candidate.getStatus() != Candidate.CandidateStatus.IN_PROGRESS) {
                        candidate.setStatus(Candidate.CandidateStatus.IN_PROGRESS);
                        candidateRepository.save(candidate);
                }

                Assessment a = ac.getAssessment();
                // Initialize Exam DTO with session and assessment details
                ExamDTO dto = new ExamDTO();
                dto.setSessionId(session.getId());
                dto.setAssessmentTitle(a.getTitle());
                dto.setDurationMinutes(a.getDurationMinutes());
                dto.setCandidateName(ac.getCandidate().getName());

                // Load all associated coding questions for this assessment
                List<CodingQuestionDTO> codingQuestions = codingQuestionRepository.findByAssessmentId(a.getId())
                                .stream()
                                .map(this::mapToCodingDTO).collect(Collectors.toList());

                // Load all associated quiz/MCQ questions
                List<QuizQuestionDTO> quizQuestions = quizQuestionRepository.findByAssessmentId(a.getId()).stream()
                                .map(this::mapToQuizDTO).collect(Collectors.toList());

                logger.info("Exam started for candidate: {}. Loaded {} coding questions and {} quiz questions.",
                                ac.getCandidate().getName(), codingQuestions.size(), quizQuestions.size());

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
                logger.info("Reference photo saved for session: {}", sessionId);
        }

        @Transactional
        public CodingResultDTO submitCode(CodeSubmissionDTO dto) {
                ExamSession session = examSessionRepository.findById(dto.getSessionId())
                                .orElseThrow(() -> new RuntimeException("Session not found"));
                CodingQuestion q = codingQuestionRepository.findById(dto.getQuestionId())
                                .orElseThrow(() -> new RuntimeException("Question not found"));

                List<TestCase> testCases = testCaseRepository.findByQuestionId(q.getId());
                logger.info("Found {} test cases for question: {}", testCases.size(), q.getTitle());
                int passed = 0;
                String finalVerdict = "ACCEPTED";
                String finalOutput = "";
                String finalError = "";

                if (testCases.isEmpty()) {
                        logger.warn("No test cases found for question {}. Running code once for feedback.", q.getId());
                        // Execute once with no input to provide candidate feedback if no test cases are
                        // defined
                        CompilerService.CompilerResult res = compilerService.executeCode(
                                        dto.getSourceCode(), dto.getLanguage(), "", "");
                        finalVerdict = res.verdict();
                        finalOutput = res.output();
                        finalError = res.error();
                } else {
                        // Iteratively execute each test case against the submission
                        for (TestCase tc : testCases) {
                                logger.debug("Running test case - Input: {}, Expected: {}", tc.getInput(),
                                                tc.getExpectedOutput());
                                CompilerService.CompilerResult res = compilerService.executeCode(
                                                dto.getSourceCode(), dto.getLanguage(), tc.getInput(),
                                                tc.getExpectedOutput());
                                logger.info("Test case result - Verdict: {}, Output: {}, Error: {}", res.verdict(),
                                                res.output(), res.error());

                                // Store the output/error of the first failing case for reporting
                                if (finalOutput.isEmpty() && !res.output().isEmpty())
                                        finalOutput = res.output();
                                if (finalError.isEmpty() && !res.error().isEmpty())
                                        finalError = res.error();

                                if ("ACCEPTED".equals(res.verdict())) {
                                        passed++;
                                } else {
                                        // Update final verdict if any test case fails
                                        finalVerdict = res.verdict();
                                        finalOutput = res.output();
                                        finalError = res.error();
                                }
                        }
                }

                int score = testCases.isEmpty() ? 0 : (passed * q.getMarks()) / testCases.size();

                CodingSubmission submission = CodingSubmission.builder()
                                .session(session)
                                .question(q)
                                .language(dto.getLanguage())
                                .sourceCode(dto.getSourceCode())
                                .verdict(finalVerdict)
                                .score(score)
                                .build();
                codingSubmissionRepository.save(submission);

                CodingResultDTO result = new CodingResultDTO();
                result.setVerdict(finalVerdict);
                result.setPassedTestCases(passed);
                result.setTotalTestCases(testCases.size());
                result.setScore(score);
                result.setOutput(finalOutput);
                result.setError(finalError);
                return result;
        }

        @Transactional
        public void submitQuizAnswer(QuizAnswerDTO dto) {
                ExamSession session = examSessionRepository.findById(dto.getSessionId())
                                .orElseThrow(() -> new RuntimeException("Session not found"));
                QuizQuestion q = quizQuestionRepository.findById(dto.getQuestionId())
                                .orElseThrow(() -> new RuntimeException("Question not found"));

                boolean isCorrect = false;
                if (q.getCorrectOption() != null) {
                        isCorrect = q.getCorrectOption().equalsIgnoreCase(dto.getSelectedOption());
                }

                QuizAnswer answer = quizAnswerRepository.findFirstBySessionIdAndQuestionId(session.getId(), q.getId())
                                .orElseGet(() -> QuizAnswer.builder()
                                                .session(session)
                                                .question(q)
                                                .build());

                answer.setSelectedOption(dto.getSelectedOption());
                answer.setCorrect(isCorrect);

                quizAnswerRepository.save(answer);
        }

        @Transactional
        public void finalSubmit(Long sessionId) {
                ExamSession session = examSessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                logger.info("Final submission received for session: {}", sessionId);

                session.setSubmittedAt(LocalDateTime.now());
                session.setStatus(ExamSession.SessionStatus.SUBMITTED);
                examSessionRepository.save(session);

                List<CodingSubmission> submissions = codingSubmissionRepository.findBySessionId(sessionId);

                // Calculate Coding Score - taking best score per question
                int codingScore = submissions.stream()
                                .collect(Collectors.groupingBy(
                                                s -> s.getQuestion().getId(),
                                                Collectors.maxBy((s1, s2) -> Integer.compare(s1.getScore(),
                                                                s2.getScore()))))
                                .values().stream()
                                .mapToInt(opt -> opt.isPresent() ? opt.get().getScore() : 0)
                                .sum();

                // Calculate Totals and Scores accurately from assessment content
                Assessment assessment = session.getAssessmentCandidate().getAssessment();

                // Quiz Scoring: Sum of marks for CORRECT answers only
                List<QuizQuestion> allQuizQuestions = quizQuestionRepository.findByAssessmentId(assessment.getId());
                int quizTotal = allQuizQuestions.stream().mapToInt(QuizQuestion::getMarks).sum();

                List<QuizAnswer> quizAnswers = quizAnswerRepository.findBySessionId(sessionId);
                int quizScore = quizAnswers.stream()
                                .collect(Collectors.toMap(
                                                a -> a.getQuestion().getId(),
                                                a -> a,
                                                (existing, replacement) -> existing))
                                .values().stream()
                                .filter(QuizAnswer::isCorrect)
                                .mapToInt(a -> a.getQuestion().getMarks())
                                .sum();

                // Coding Total: Sum of marks for all coding questions in assessment
                List<CodingQuestion> codingQuestions = codingQuestionRepository.findByAssessmentId(assessment.getId());
                int codingTotal = codingQuestions.stream().mapToInt(CodingQuestion::getMarks).sum();

                // Count proctoring violations
                List<ProctoringLog> logs = proctoringLogRepository.findBySessionId(sessionId);
                int violationCount = logs.size();

                int tabSwitches = (int) logs.stream().filter(l -> "TAB_SWITCH".equals(l.getViolationType())).count();
                int phoneDetected = (int) logs.stream().filter(l -> "PHONE_DETECTED".equals(l.getViolationType()))
                                .count();
                int multipleFaces = (int) logs.stream().filter(l -> "MULTIPLE_FACES".equals(l.getViolationType()))
                                .count();
                int lookingAway = (int) logs.stream().filter(l -> "LOOKING_AWAY".equals(l.getViolationType())).count();
                int movement = (int) logs.stream().filter(l -> "SUSPICIOUS_MOVEMENT".equals(l.getViolationType()))
                                .count();

                // Oral Scoring - Group by question to avoid duplicates and normalize to 10
                // marks per question
                List<MicroOralSubmission> oralSubmissions = microOralSubmissionRepository.findBySessionId(sessionId);
                Map<Long, Integer> bestOralScores = oralSubmissions.stream()
                                .filter(s -> s.getQuestion() != null)
                                .collect(Collectors.groupingBy(
                                                s -> s.getQuestion().getId(),
                                                Collectors.mapping(
                                                                s -> s.getScore() != null ? s.getScore() : 0,
                                                                Collectors.maxBy(Integer::compare))))
                                .entrySet().stream()
                                .collect(Collectors.toMap(
                                                Map.Entry::getKey,
                                                e -> e.getValue().orElse(0)));

                int oralScore = bestOralScores.values().stream()
                                .mapToInt(score -> (int) Math.round(score * 0.1)) // Assuming AI score is 0-100,
                                                                                  // normalize to 10 marks
                                .sum();
                int oralTotal = bestOralScores.size() * 10;
                if (oralTotal == 0)
                        oralTotal = 50; // Default total if none

                int rawTotal = quizTotal + codingTotal + oralTotal;
                int rawScore = quizScore + codingScore + oralScore;

                // Penalty Factor: Math.max(0.05, 1 - (violationCount / 200))
                float penaltyFactor = Math.max(0.05f, 1 - (violationCount / 200.0f));
                int finalScoreMarks = Math.round(rawScore * penaltyFactor);

                // Use existing result if any, or create new
                Result result = resultRepository.findBySessionId(sessionId).orElse(new Result());
                result.setSession(session);
                result.setQuizScore(quizScore);
                result.setQuizTotal(quizTotal);
                result.setCodingScore(codingScore);
                result.setCodingTotal(codingTotal);
                result.setOralScore(oralScore);
                result.setOralTotal(oralTotal);
                result.setTotalScore(finalScoreMarks);
                result.setViolationCount(violationCount);
                result.setTabSwitchCount(tabSwitches);
                result.setPhoneCount(phoneDetected);
                result.setMultipleFacesCount(multipleFaces);
                result.setLookingAwayCount(lookingAway);
                result.setSuspiciousMovementCount(movement);
                result.setVerdict("COMPLETED");
                result.setGeneratedAt(LocalDateTime.now());

                resultRepository.save(result);
                logger.info("Submission processed successfully. Result ID: {}", result.getId());

                // Update candidate status
                Candidate candidate = session.getAssessmentCandidate().getCandidate();
                candidate.setStatus(Candidate.CandidateStatus.COMPLETED);
                candidateRepository.save(candidate);
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
                        dto.setTestCases(q.getTestCases().stream()
                                        .filter(tc -> !tc.isHidden())
                                        .map(tc -> {
                                                TestCaseDTO tcDto = new TestCaseDTO();
                                                tcDto.setInput(tc.getInput());
                                                tcDto.setExpectedOutput(tc.getExpectedOutput());
                                                tcDto.setHidden(false);
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
                dto.setMarks(q.getMarks());
                dto.setTopic(q.getTopic() != null ? q.getTopic() : "General");
                dto.setSectionName(q.getSectionName() != null ? q.getSectionName() : "Main Section");
                dto.setAudioBase64(q.getAudioBase64());
                return dto;
        }
}
