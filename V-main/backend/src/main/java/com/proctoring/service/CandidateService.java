package com.proctoring.service;

import com.proctoring.dto.CandidateDTO;
import com.proctoring.model.Candidate;
import com.proctoring.repository.CandidateRepository;
import com.proctoring.repository.AssessmentCandidateRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final AssessmentCandidateRepository assessmentCandidateRepository;
    private final EmailService emailService;

    public CandidateService(CandidateRepository candidateRepository, 
                          AssessmentCandidateRepository assessmentCandidateRepository,
                          EmailService emailService) {
        this.candidateRepository = candidateRepository;
        this.assessmentCandidateRepository = assessmentCandidateRepository;
        this.emailService = emailService;
    }

    public List<CandidateDTO> getAllCandidates() {
        return candidateRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CandidateDTO addCandidate(CandidateDTO dto) {
        Candidate candidate = Candidate.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .status(Candidate.CandidateStatus.PENDING)
                .build();
        Candidate saved = candidateRepository.save(candidate);
        
        // Send Welcome Email
        try {
            emailService.sendWelcomeEmail(saved.getEmail(), saved.getName());
        } catch (Exception e) {
            // Log but don't fail candidate creation
        }
        
        return mapToDTO(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteCandidate(Long id) {
        if (candidateRepository.existsById(id)) {
            // Manually delete links to assessments (AssessmentCandidate)
            // This will trigger @OneToMany cascade in AssessmentCandidate -> ExamSession -> Result
            java.util.List<com.proctoring.model.AssessmentCandidate> assignments = 
                assessmentCandidateRepository.findByCandidateId(id);
            for (com.proctoring.model.AssessmentCandidate assignment : assignments) {
                assessmentCandidateRepository.delete(assignment);
            }
            
            candidateRepository.deleteById(id);
        } else {
            throw new RuntimeException("Candidate not found");
        }
    }

    private CandidateDTO mapToDTO(Candidate c) {
        CandidateDTO dto = new CandidateDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setEmail(c.getEmail());
        dto.setPhone(c.getPhone());
        dto.setStatus(c.getStatus().name());
        return dto;
    }
}
