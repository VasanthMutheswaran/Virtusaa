package com.proctoring.repository;

import com.proctoring.model.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {
    List<QuizAnswer> findBySessionId(Long sessionId);

    Optional<QuizAnswer> findFirstBySessionIdAndQuestionId(Long sessionId, Long questionId);
}
