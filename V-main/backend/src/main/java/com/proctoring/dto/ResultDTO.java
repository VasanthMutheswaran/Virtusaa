package com.proctoring.dto;

import java.time.LocalDateTime;

public class ResultDTO {
    private Long id;
    private Long sessionId;
    private String candidateName;
    private String candidateEmail;
    private String firstName;
    private String lastName;
    private String phone;
    private String countryCode;
    private String resumeUrl;
    private int quizScore;
    private int quizTotal;
    private int codingScore;
    private int codingTotal;
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
    private int oralScore;
    private int oralTotal;
    private String referencePhoto;
    private String verdict;
    private LocalDateTime generatedAt;
    private LocalDateTime submittedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getCandidateEmail() {
        return candidateEmail;
    }

    public void setCandidateEmail(String candidateEmail) {
        this.candidateEmail = candidateEmail;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
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

    public int getPersonMismatchCount() {
        return personMismatchCount;
    }

    public void setPersonMismatchCount(int personMismatchCount) {
        this.personMismatchCount = personMismatchCount;
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

    public String getReferencePhoto() {
        return referencePhoto;
    }

    public void setReferencePhoto(String referencePhoto) {
        this.referencePhoto = referencePhoto;
    }

    public String getVerdict() {
        return verdict;
    }

    public void setVerdict(String verdict) {
        this.verdict = verdict;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
