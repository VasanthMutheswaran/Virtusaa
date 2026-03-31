/**
 * @project AI-Powered Proctoring & Automated Assessment System
 * @version Virtusa Jatayu Season 5 - Stage 2 (POC)
 * @description Domain entity representing an assessment (MCQ/Coding).
 * @author <YOUR_TEAM_NAME>
 */
package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "assessments")
public class Assessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private int durationMinutes = 60;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private AssessmentStatus status = AssessmentStatus.DRAFT;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private Admin createdBy;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CodingQuestion> codingQuestions;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuizQuestion> quizQuestions;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssessmentCandidate> assessmentCandidates;

    private boolean clarityCheckEnabled = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum AssessmentStatus {
        DRAFT, ACTIVE, COMPLETED, ARCHIVED
    }

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

    public AssessmentStatus getStatus() {
        return status;
    }

    public void setStatus(AssessmentStatus status) {
        this.status = status;
    }

    public Admin getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Admin createdBy) {
        this.createdBy = createdBy;
    }

    public List<CodingQuestion> getCodingQuestions() {
        return codingQuestions;
    }

    public void setCodingQuestions(List<CodingQuestion> codingQuestions) {
        this.codingQuestions = codingQuestions;
    }

    public List<QuizQuestion> getQuizQuestions() {
        return quizQuestions;
    }

    public void setQuizQuestions(List<QuizQuestion> quizQuestions) {
        this.quizQuestions = quizQuestions;
    }

    public boolean isClarityCheckEnabled() {
        return clarityCheckEnabled;
    }

    public void setClarityCheckEnabled(boolean clarityCheckEnabled) {
        this.clarityCheckEnabled = clarityCheckEnabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Assessment() {
    }

    public static class AssessmentBuilder {
        private Assessment instance = new Assessment();

        public AssessmentBuilder id(Long id) {
            instance.setId(id);
            return this;
        }

        public AssessmentBuilder title(String t) {
            instance.setTitle(t);
            return this;
        }

        public AssessmentBuilder description(String d) {
            instance.setDescription(d);
            return this;
        }

        public AssessmentBuilder durationMinutes(int m) {
            instance.setDurationMinutes(m);
            return this;
        }

        public AssessmentBuilder status(AssessmentStatus s) {
            instance.setStatus(s);
            return this;
        }

        public AssessmentBuilder startTime(LocalDateTime st) {
            instance.setStartTime(st);
            return this;
        }

        public AssessmentBuilder endTime(LocalDateTime et) {
            instance.setEndTime(et);
            return this;
        }

        public AssessmentBuilder createdBy(Admin cb) {
            instance.setCreatedBy(cb);
            return this;
        }

        public AssessmentBuilder clarityCheckEnabled(boolean e) {
            instance.setClarityCheckEnabled(e);
            return this;
        }

        public Assessment build() {
            return instance;
        }
    }

    public static AssessmentBuilder builder() {
        return new AssessmentBuilder();
    }
}
