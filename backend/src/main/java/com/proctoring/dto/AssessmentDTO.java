package com.proctoring.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AssessmentDTO {
    private Long id;
    private String title;
    private String description;
    private int durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private int totalCodingQuestions;
    private int totalQuizQuestions;
    private List<CodingQuestionDTO> codingQuestions;
    private List<QuizQuestionDTO> quizQuestions;
    private boolean clarityCheckEnabled;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getTotalCodingQuestions() {
        return totalCodingQuestions;
    }

    public void setTotalCodingQuestions(int totalCodingQuestions) {
        this.totalCodingQuestions = totalCodingQuestions;
    }

    public int getTotalQuizQuestions() {
        return totalQuizQuestions;
    }

    public void setTotalQuizQuestions(int totalQuizQuestions) {
        this.totalQuizQuestions = totalQuizQuestions;
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

    public boolean isClarityCheckEnabled() {
        return clarityCheckEnabled;
    }

    public void setClarityCheckEnabled(boolean clarityCheckEnabled) {
        this.clarityCheckEnabled = clarityCheckEnabled;
    }
}
