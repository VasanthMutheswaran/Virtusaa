package com.proctoring.repository;

import com.proctoring.model.MicroOralSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MicroOralSubmissionRepository extends JpaRepository<MicroOralSubmission, Long> {
    @Query("SELECT s FROM MicroOralSubmission s LEFT JOIN FETCH s.question WHERE s.session.id = :sessionId")
    List<MicroOralSubmission> findBySessionId(@Param("sessionId") Long sessionId);
}
