/**
 * @project AI-Powered Proctoring & Automated Assessment System
 * @version Virtusa Jatayu Season 5 - Stage 2 (POC)
 * @description Domain entity representing a candidate session.
 * @author <YOUR_TEAM_NAME>
 */
package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "exam_sessions")
public class ExamSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "assessment_candidate_id")
    private AssessmentCandidate assessmentCandidate;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.NOT_STARTED;

    private String ipAddress;
    private String browserInfo;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String referencePhoto;

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private Result result;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CodingSubmission> codingSubmissions;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuizAnswer> quizAnswers;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProctoringLog> proctoringLogs;

    public enum SessionStatus {
        NOT_STARTED, IN_PROGRESS, SUBMITTED, TIMED_OUT
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AssessmentCandidate getAssessmentCandidate() {
        return assessmentCandidate;
    }

    public void setAssessmentCandidate(AssessmentCandidate assessmentCandidate) {
        this.assessmentCandidate = assessmentCandidate;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getBrowserInfo() {
        return browserInfo;
    }

    public void setBrowserInfo(String browserInfo) {
        this.browserInfo = browserInfo;
    }

    public String getReferencePhoto() {
        return referencePhoto;
    }

    public void setReferencePhoto(String referencePhoto) {
        this.referencePhoto = referencePhoto;
    }

    public ExamSession() {
    }
}
