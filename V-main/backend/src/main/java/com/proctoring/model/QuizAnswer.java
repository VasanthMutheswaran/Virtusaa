package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_answers")
public class QuizAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ExamSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private QuizQuestion question;

    @Column(columnDefinition = "char(1)")
    private String selectedOption;

    private boolean isCorrect;

    private LocalDateTime answeredAt = LocalDateTime.now();

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

    public QuizQuestion getQuestion() {
        return question;
    }

    public void setQuestion(QuizQuestion question) {
        this.question = question;
    }

    public String getSelectedOption() {
        return selectedOption;
    }

    public void setSelectedOption(String selectedOption) {
        this.selectedOption = selectedOption;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public LocalDateTime getAnsweredAt() {
        return answeredAt;
    }

    public void setAnsweredAt(LocalDateTime answeredAt) {
        this.answeredAt = answeredAt;
    }

    public QuizAnswer() {
    }

    public static class QuizAnswerBuilder {
        private QuizAnswer instance = new QuizAnswer();

        public QuizAnswerBuilder session(ExamSession s) {
            instance.setSession(s);
            return this;
        }

        public QuizAnswerBuilder question(QuizQuestion q) {
            instance.setQuestion(q);
            return this;
        }

        public QuizAnswerBuilder selectedOption(String so) {
            instance.setSelectedOption(so);
            return this;
        }

        public QuizAnswerBuilder isCorrect(boolean ic) {
            instance.setCorrect(ic);
            return this;
        }

        public QuizAnswer build() {
            return instance;
        }
    }

    public static QuizAnswerBuilder builder() {
        return new QuizAnswerBuilder();
    }
}
