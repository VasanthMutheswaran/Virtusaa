package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "coding_submissions")
public class CodingSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ExamSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private CodingQuestion question;

    @Column(nullable = false)
    private String language;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String sourceCode;

    private String verdict;
    private int score;

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

    public CodingQuestion getQuestion() {
        return question;
    }

    public void setQuestion(CodingQuestion question) {
        this.question = question;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getVerdict() {
        return verdict;
    }

    public void setVerdict(String verdict) {
        this.verdict = verdict;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public CodingSubmission() {
    }

    // Manual static builder for convenience
    public static class CodingSubmissionBuilder {
        private CodingSubmission instance = new CodingSubmission();

        public CodingSubmissionBuilder session(ExamSession s) {
            instance.setSession(s);
            return this;
        }

        public CodingSubmissionBuilder question(CodingQuestion q) {
            instance.setQuestion(q);
            return this;
        }

        public CodingSubmissionBuilder language(String l) {
            instance.setLanguage(l);
            return this;
        }

        public CodingSubmissionBuilder sourceCode(String sc) {
            instance.setSourceCode(sc);
            return this;
        }

        public CodingSubmissionBuilder verdict(String v) {
            instance.setVerdict(v);
            return this;
        }

        public CodingSubmissionBuilder score(int s) {
            instance.setScore(s);
            return this;
        }

        public CodingSubmission build() {
            return instance;
        }
    }

    public static CodingSubmissionBuilder builder() {
        return new CodingSubmissionBuilder();
    }
}
