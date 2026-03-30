package com.proctoring.model;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;

    @Column(nullable = false, columnDefinition = "char(1)")
    private String correctOption;

    private int marks = 1;
    private String topic;

    @Column(name = "section_name")
    private String sectionName;

    @Column(columnDefinition = "TEXT")
    private String audioBase64;

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

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getOptionA() {
        return optionA;
    }

    public void setOptionA(String optionA) {
        this.optionA = optionA;
    }

    public String getOptionB() {
        return optionB;
    }

    public void setOptionB(String optionB) {
        this.optionB = optionB;
    }

    public String getOptionC() {
        return optionC;
    }

    public void setOptionC(String optionC) {
        this.optionC = optionC;
    }

    public String getOptionD() {
        return optionD;
    }

    public void setOptionD(String optionD) {
        this.optionD = optionD;
    }

    public String getCorrectOption() {
        return correctOption;
    }

    public void setCorrectOption(String correctOption) {
        this.correctOption = correctOption;
    }

    public int getMarks() {
        return marks;
    }

    public void setMarks(int marks) {
        this.marks = marks;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getSectionName() {
        return sectionName;
    }

    public void setSectionName(String sectionName) {
        this.sectionName = sectionName;
    }

    public String getAudioBase64() {
        return audioBase64;
    }

    public void setAudioBase64(String audioBase64) {
        this.audioBase64 = audioBase64;
    }

    public QuizQuestion() {
    }

    public static class QuizQuestionBuilder {
        private QuizQuestion instance = new QuizQuestion();

        public QuizQuestionBuilder id(Long id) {
            instance.setId(id);
            return this;
        }

        public QuizQuestionBuilder assessment(Assessment a) {
            instance.setAssessment(a);
            return this;
        }

        public QuizQuestionBuilder question(String q) {
            instance.setQuestion(q);
            return this;
        }

        public QuizQuestionBuilder optionA(String a) {
            instance.setOptionA(a);
            return this;
        }

        public QuizQuestionBuilder optionB(String b) {
            instance.setOptionB(b);
            return this;
        }

        public QuizQuestionBuilder optionC(String c) {
            instance.setOptionC(c);
            return this;
        }

        public QuizQuestionBuilder optionD(String d) {
            instance.setOptionD(d);
            return this;
        }

        public QuizQuestionBuilder correctOption(String co) {
            instance.setCorrectOption(co);
            return this;
        }

        public QuizQuestionBuilder marks(int m) {
            instance.setMarks(m);
            return this;
        }

        public QuizQuestionBuilder topic(String t) {
            instance.setTopic(t);
            return this;
        }

        public QuizQuestionBuilder sectionName(String s) {
            instance.setSectionName(s);
            return this;
        }

        public QuizQuestionBuilder audioBase64(String audioBase64) {
            instance.setAudioBase64(audioBase64);
            return this;
        }

        public QuizQuestion build() {
            return instance;
        }
    }

    public static QuizQuestionBuilder builder() {
        return new QuizQuestionBuilder();
    }
}
