package com.proctoring.repository;

import com.proctoring.model.ProctoringLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProctoringLogRepository extends JpaRepository<ProctoringLog, Long> {
    List<ProctoringLog> findBySessionId(Long sessionId);

    long countBySessionId(Long sessionId);

    @Query("SELECT p.violationType, COUNT(p) FROM ProctoringLog p GROUP BY p.violationType")
    List<Object[]> countByViolationType();
}
