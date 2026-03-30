package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
public class Candidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String firstName;
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;
    private String countryCode;

    private String resumeUrl;

    @Enumerated(EnumType.STRING)
    private CandidateStatus status = CandidateStatus.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();

    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return name;
    }

    public enum CandidateStatus {
        PENDING, INVITED, IN_PROGRESS, COMPLETED, REJECTED
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public CandidateStatus getStatus() {
        return status;
    }

    public void setStatus(CandidateStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Candidate() {
    }

    public static class CandidateBuilder {
        private Candidate instance = new Candidate();

        public CandidateBuilder id(Long id) {
            instance.setId(id);
            return this;
        }

        public CandidateBuilder name(String n) {
            instance.setName(n);
            return this;
        }

        public CandidateBuilder email(String e) {
            instance.setEmail(e);
            return this;
        }

        public CandidateBuilder phone(String p) {
            instance.setPhone(p);
            return this;
        }

        public CandidateBuilder countryCode(String cc) {
            instance.setCountryCode(cc);
            return this;
        }

        public CandidateBuilder status(CandidateStatus s) {
            instance.setStatus(s);
            return this;
        }

        public CandidateBuilder firstName(String fn) {
            instance.setFirstName(fn);
            return this;
        }

        public CandidateBuilder lastName(String ln) {
            instance.setLastName(ln);
            return this;
        }

        public CandidateBuilder resumeUrl(String url) {
            instance.setResumeUrl(url);
            return this;
        }

        public Candidate build() {
            return instance;
        }
    }

    public static CandidateBuilder builder() {
        return new CandidateBuilder();
    }
}
