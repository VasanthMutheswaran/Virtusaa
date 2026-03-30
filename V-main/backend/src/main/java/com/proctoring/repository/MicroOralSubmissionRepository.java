package com.proctoring.repository;

import com.proctoring.model.MicroOralSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MicroOralSubmissionRepository extends JpaRepository<MicroOralSubmission, Long> {
    List<MicroOralSubmission> findBySessionId(Long sessionId);
}
