package com.proctoring.repository;

import com.proctoring.model.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    Optional<ExamSession> findByAssessmentCandidateId(Long assessmentCandidateId);
    List<ExamSession> findByStatus(ExamSession.SessionStatus status);
}
