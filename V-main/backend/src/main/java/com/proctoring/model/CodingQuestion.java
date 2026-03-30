package com.proctoring.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "coding_questions")
public class CodingQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String difficulty = "MEDIUM";
    private int marks = 10;
    private int timeLimitSeconds = 2;
    private int memoryLimitMb = 256;

    @Column(columnDefinition = "TEXT")
    private String sampleInput;

    @Column(columnDefinition = "TEXT")
    private String sampleOutput;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL)
    private List<TestCase> testCases;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
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

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public int getMarks() {
        return marks;
    }

    public void setMarks(int marks) {
        this.marks = marks;
    }

    public int getTimeLimitSeconds() {
        return timeLimitSeconds;
    }

    public void setTimeLimitSeconds(int timeLimitSeconds) {
        this.timeLimitSeconds = timeLimitSeconds;
    }

    public int getMemoryLimitMb() {
        return memoryLimitMb;
    }

    public void setMemoryLimitMb(int memoryLimitMb) {
        this.memoryLimitMb = memoryLimitMb;
    }

    public String getSampleInput() {
        return sampleInput;
    }

    public void setSampleInput(String sampleInput) {
        this.sampleInput = sampleInput;
    }

    public String getSampleOutput() {
        return sampleOutput;
    }

    public void setSampleOutput(String sampleOutput) {
        this.sampleOutput = sampleOutput;
    }

    public List<TestCase> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<TestCase> testCases) {
        this.testCases = testCases;
    }

    public CodingQuestion() {
    }

    public static class CodingQuestionBuilder {
        private CodingQuestion instance = new CodingQuestion();

        public CodingQuestionBuilder id(Long id) {
            instance.setId(id);
            return this;
        }

        public CodingQuestionBuilder assessment(Assessment a) {
            instance.setAssessment(a);
            return this;
        }

        public CodingQuestionBuilder title(String t) {
            instance.setTitle(t);
            return this;
        }

        public CodingQuestionBuilder description(String d) {
            instance.setDescription(d);
            return this;
        }

        public CodingQuestionBuilder difficulty(String diff) {
            instance.setDifficulty(diff);
            return this;
        }

        public CodingQuestionBuilder marks(int m) {
            instance.setMarks(m);
            return this;
        }

        public CodingQuestionBuilder timeLimitSeconds(int s) {
            instance.setTimeLimitSeconds(s);
            return this;
        }

        public CodingQuestionBuilder memoryLimitMb(int m) {
            instance.setMemoryLimitMb(m);
            return this;
        }

        public CodingQuestionBuilder sampleInput(String si) {
            instance.setSampleInput(si);
            return this;
        }

        public CodingQuestionBuilder sampleOutput(String so) {
            instance.setSampleOutput(so);
            return this;
        }

        public CodingQuestion build() {
            return instance;
        }
    }

    public static CodingQuestionBuilder builder() {
        return new CodingQuestionBuilder();
    }
}
