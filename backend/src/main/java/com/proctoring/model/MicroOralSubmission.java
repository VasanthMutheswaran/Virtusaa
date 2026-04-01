package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "micro_oral_submissions")
public class MicroOralSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @JsonIgnore
    private ExamSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private MicroOralQuestion question;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private LocalDateTime submittedAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ExamSession getSession() {
        return session;
    }

    public void setSession(ExamSession session) {
        this.session = session;
    }

    public MicroOralQuestion getQuestion() {
        return question;
    }

    public void setQuestion(MicroOralQuestion question) {
        this.question = question;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public MicroOralSubmission() {
    }
}
