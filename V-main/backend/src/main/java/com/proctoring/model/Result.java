package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "results")
public class Result {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", unique = true)
    private ExamSession session;

    private int quizScore;
    private int quizTotal;
    private int codingScore;
    private int codingTotal;
    private int sqlScore;
    private int sqlTotal;
    private int oralScore;
    private int oralTotal;
    private int totalScore;
    private int violationCount;
    private int tabSwitchCount;
    private int phoneCount;
    private int multipleFacesCount;
    private int noFaceCount;
    private int windowBlurCount;
    private int lookingAwayCount;
    private int suspiciousMovementCount;
    private int personMismatchCount;
    private String verdict;

    private LocalDateTime generatedAt = LocalDateTime.now();

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

    public int getQuizScore() {
        return quizScore;
    }

    public void setQuizScore(int quizScore) {
        this.quizScore = quizScore;
    }

    public int getQuizTotal() {
        return quizTotal;
    }

    public void setQuizTotal(int quizTotal) {
        this.quizTotal = quizTotal;
    }

    public int getCodingScore() {
        return codingScore;
    }

    public void setCodingScore(int codingScore) {
        this.codingScore = codingScore;
    }

    public int getCodingTotal() {
        return codingTotal;
    }

    public void setCodingTotal(int codingTotal) {
        this.codingTotal = codingTotal;
    }

    public int getSqlScore() {
        return sqlScore;
    }

    public void setSqlScore(int sqlScore) {
        this.sqlScore = sqlScore;
    }

    public int getSqlTotal() {
        return sqlTotal;
    }

    public void setSqlTotal(int sqlTotal) {
        this.sqlTotal = sqlTotal;
    }

    public int getOralScore() {
        return oralScore;
    }

    public void setOralScore(int oralScore) {
        this.oralScore = oralScore;
    }

    public int getOralTotal() {
        return oralTotal;
    }

    public void setOralTotal(int oralTotal) {
        this.oralTotal = oralTotal;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getViolationCount() {
        return violationCount;
    }

    public void setViolationCount(int violationCount) {
        this.violationCount = violationCount;
    }

    public int getTabSwitchCount() {
        return tabSwitchCount;
    }

    public void setTabSwitchCount(int tabSwitchCount) {
        this.tabSwitchCount = tabSwitchCount;
    }

    public int getPhoneCount() {
        return phoneCount;
    }

    public void setPhoneCount(int phoneCount) {
        this.phoneCount = phoneCount;
    }

    public int getMultipleFacesCount() {
        return multipleFacesCount;
    }

    public void setMultipleFacesCount(int multipleFacesCount) {
        this.multipleFacesCount = multipleFacesCount;
    }

    public int getNoFaceCount() {
        return noFaceCount;
    }

    public void setNoFaceCount(int noFaceCount) {
        this.noFaceCount = noFaceCount;
    }

    public int getWindowBlurCount() {
        return windowBlurCount;
    }

    public void setWindowBlurCount(int windowBlurCount) {
        this.windowBlurCount = windowBlurCount;
    }

    public int getLookingAwayCount() {
        return lookingAwayCount;
    }

    public void setLookingAwayCount(int lookingAwayCount) {
        this.lookingAwayCount = lookingAwayCount;
    }

    public int getSuspiciousMovementCount() {
        return suspiciousMovementCount;
    }

    public void setSuspiciousMovementCount(int suspiciousMovementCount) {
        this.suspiciousMovementCount = suspiciousMovementCount;
    }

    public String getVerdict() {
        return verdict;
    }

    public void setVerdict(String verdict) {
        this.verdict = verdict;
    }

    public int getPersonMismatchCount() {
        return personMismatchCount;
    }

    public void setPersonMismatchCount(int personMismatchCount) {
        this.personMismatchCount = personMismatchCount;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public Result() {
    }

    public static class ResultBuilder {
        private Result instance = new Result();

        public ResultBuilder session(ExamSession s) {
            instance.setSession(s);
            return this;
        }

        public ResultBuilder quizScore(int s) {
            instance.setQuizScore(s);
            return this;
        }

        public ResultBuilder quizTotal(int t) {
            instance.setQuizTotal(t);
            return this;
        }

        public ResultBuilder codingScore(int s) {
            instance.setCodingScore(s);
            return this;
        }

        public ResultBuilder codingTotal(int t) {
            instance.setCodingTotal(t);
            return this;
        }

        public ResultBuilder sqlScore(int s) {
            instance.setSqlScore(s);
            return this;
        }

        public ResultBuilder oralScore(int s) {
            instance.setOralScore(s);
            return this;
        }

        public ResultBuilder totalScore(int s) {
            instance.setTotalScore(s);
            return this;
        }

        public ResultBuilder violationCount(int c) {
            instance.setViolationCount(c);
            return this;
        }

        public ResultBuilder verdict(String v) {
            instance.setVerdict(v);
            return this;
        }

        public ResultBuilder personMismatchCount(int c) {
            instance.setPersonMismatchCount(c);
            return this;
        }

        public Result build() {
            return instance;
        }
    }

    public static ResultBuilder builder() {
        return new ResultBuilder();
    }
}
