package com.proctoring.repository;

import com.proctoring.model.CodingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CodingQuestionRepository extends JpaRepository<CodingQuestion, Long> {
    List<CodingQuestion> findByAssessmentId(Long assessmentId);
}
