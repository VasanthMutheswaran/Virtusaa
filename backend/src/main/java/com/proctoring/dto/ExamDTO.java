package com.proctoring.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ExamDTO {
    private Long sessionId;
    private String candidateName;
    private String assessmentTitle;
    private int durationMinutes;
    private LocalDateTime startTime;
    private String status;
    private List<CodingQuestionDTO> codingQuestions;
    private List<QuizQuestionDTO> quizQuestions;
    private String referencePhoto;
    private boolean clarityCheckEnabled;

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getAssessmentTitle() {
        return assessmentTitle;
    }

    public void setAssessmentTitle(String assessmentTitle) {
        this.assessmentTitle = assessmentTitle;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<CodingQuestionDTO> getCodingQuestions() {
        return codingQuestions;
    }

    public void setCodingQuestions(List<CodingQuestionDTO> codingQuestions) {
        this.codingQuestions = codingQuestions;
    }

    public List<QuizQuestionDTO> getQuizQuestions() {
        return quizQuestions;
    }

    public void setQuizQuestions(List<QuizQuestionDTO> quizQuestions) {
        this.quizQuestions = quizQuestions;
    }

    public String getReferencePhoto() {
        return referencePhoto;
    }

    public void setReferencePhoto(String referencePhoto) {
        this.referencePhoto = referencePhoto;
    }

    public boolean isClarityCheckEnabled() {
        return clarityCheckEnabled;
    }

    public void setClarityCheckEnabled(boolean clarityCheckEnabled) {
        this.clarityCheckEnabled = clarityCheckEnabled;
    }
}
