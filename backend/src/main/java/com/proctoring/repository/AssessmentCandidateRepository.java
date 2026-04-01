package com.proctoring.repository;

import com.proctoring.model.AssessmentCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AssessmentCandidateRepository extends JpaRepository<AssessmentCandidate, Long> {
    Optional<AssessmentCandidate> findByTestToken(String testToken);

    Optional<AssessmentCandidate> findByAssessmentIdAndCandidateId(Long assessmentId, Long candidateId);

    Optional<AssessmentCandidate> findByUsernameAndPassword(String username, String password);

    Optional<AssessmentCandidate> findByUsername(String username);

    List<AssessmentCandidate> findByCandidateId(Long id);
}
