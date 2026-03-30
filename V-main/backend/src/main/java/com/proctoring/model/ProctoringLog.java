package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "proctoring_logs")
public class ProctoringLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private ExamSession session;

    @Column(nullable = false)
    private String violationType;

    private String severity = "LOW";

    @Column(columnDefinition = "TEXT")
    private String description;

    private String screenshotUrl;
    private Double matchScore;

    private LocalDateTime occurredAt = LocalDateTime.now();

    public enum ViolationType {
        MULTIPLE_FACES, NO_FACE, TAB_SWITCH, SUSPICIOUS_MOVEMENT,
        MICROPHONE_NOISE, PHONE_DETECTED, LOOKING_AWAY
    }

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

    public String getViolationType() {
        return violationType;
    }

    public void setViolationType(String violationType) {
        this.violationType = violationType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getScreenshotUrl() {
        return screenshotUrl;
    }

    public void setScreenshotUrl(String screenshotUrl) {
        this.screenshotUrl = screenshotUrl;
    }

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public ProctoringLog() {
    }

    public static class ProctoringLogBuilder {
        private ProctoringLog instance = new ProctoringLog();

        public ProctoringLogBuilder session(ExamSession s) {
            instance.setSession(s);
            return this;
        }

        public ProctoringLogBuilder violationType(String vt) {
            instance.setViolationType(vt);
            return this;
        }

        public ProctoringLogBuilder severity(String s) {
            instance.setSeverity(s);
            return this;
        }

        public ProctoringLogBuilder description(String d) {
            instance.setDescription(d);
            return this;
        }

        public ProctoringLogBuilder occurredAt(LocalDateTime at) {
            instance.setOccurredAt(at);
            return this;
        }

        public ProctoringLogBuilder matchScore(Double ms) {
            instance.setMatchScore(ms);
            return this;
        }

        public ProctoringLogBuilder screenshotUrl(String url) {
            instance.setScreenshotUrl(url);
            return this;
        }

        public ProctoringLog build() {
            return instance;
        }
    }

    public static ProctoringLogBuilder builder() {
        return new ProctoringLogBuilder();
    }
}
