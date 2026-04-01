package com.proctoring.repository;

import com.proctoring.model.MicroOralQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MicroOralQuestionRepository extends JpaRepository<MicroOralQuestion, Long> {
    List<MicroOralQuestion> findByAssessmentId(Long assessmentId);
    java.util.Optional<MicroOralQuestion> findByQuestionTextAndTopic(String questionText, String topic);
}
