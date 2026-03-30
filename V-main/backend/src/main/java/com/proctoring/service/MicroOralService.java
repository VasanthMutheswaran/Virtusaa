package com.proctoring.service;

import com.proctoring.model.ExamSession;
import com.proctoring.model.MicroOralQuestion;
import com.proctoring.model.MicroOralSubmission;
import com.proctoring.repository.ExamSessionRepository;
import com.proctoring.repository.MicroOralQuestionRepository;
import com.proctoring.repository.MicroOralSubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class MicroOralService {
    private static final Logger logger = LoggerFactory.getLogger(MicroOralService.class);

    private final MicroOralSubmissionRepository submissionRepository;
    private final MicroOralQuestionRepository questionRepository;
    private final ExamSessionRepository sessionRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.monitor.url:http://localhost:5000}")
    private String aiMonitorUrl;

    public MicroOralService(MicroOralSubmissionRepository submissionRepository,
            MicroOralQuestionRepository questionRepository,
            ExamSessionRepository sessionRepository,
            RestTemplate restTemplate) {
        this.submissionRepository = submissionRepository;
        this.questionRepository = questionRepository;
        this.sessionRepository = sessionRepository;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public MicroOralSubmission submitOralAnswer(Long sessionId, String questionText, String topic, String transcript) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        MicroOralQuestion question = questionRepository.findByQuestionTextAndTopic(questionText, topic)
                .orElseGet(() -> {
                    MicroOralQuestion q = new MicroOralQuestion();
                    q.setQuestionText(questionText);
                    q.setTopic(topic);
                    q.setAssessment(session.getAssessmentCandidate().getAssessment());
                    return questionRepository.save(q);
                });

        logger.info("Evaluating oral submission for session {} and question {}", sessionId, question.getId());

        // Call AI Monitor for evaluation
        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("transcript", transcript);
        aiRequest.put("question", question.getQuestionText());
        aiRequest.put("expectedKeywords", List.of(question.getTopic() != null ? question.getTopic() : ""));

        Map<String, Object> aiResponse;
        try {
            aiResponse = restTemplate.postForObject(aiMonitorUrl + "/evaluate-oral", aiRequest, Map.class);
        } catch (Exception e) {
            logger.error("Failed to call AI Monitor for evaluation: {}", e.getMessage());
            aiResponse = new HashMap<>();
        }

        Integer score = (Integer) aiResponse.getOrDefault("score", 0);
        String feedback = (String) aiResponse.getOrDefault("feedback", "AI evaluation failed.");

        MicroOralSubmission submission = new MicroOralSubmission();
        submission.setSession(session);
        submission.setQuestion(question);
        submission.setTranscript(transcript);
        submission.setScore(score);
        submission.setFeedback(feedback);
        submission.setSubmittedAt(LocalDateTime.now());

        return submissionRepository.save(submission);
    }

    public List<MicroOralSubmission> getSubmissionsBySession(Long sessionId) {
        return submissionRepository.findBySessionId(sessionId);
    }
}
