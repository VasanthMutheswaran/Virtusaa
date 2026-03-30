package com.proctoring.config;

import com.proctoring.model.Admin;
import com.proctoring.model.Assessment;
import com.proctoring.model.AssessmentCandidate;
import com.proctoring.model.Candidate;
import com.proctoring.repository.AdminRepository;
import com.proctoring.repository.AssessmentCandidateRepository;
import com.proctoring.repository.AssessmentRepository;
import com.proctoring.repository.CandidateRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final CandidateRepository candidateRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentCandidateRepository assessmentCandidateRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AdminRepository adminRepository, 
                           CandidateRepository candidateRepository,
                           AssessmentRepository assessmentRepository,
                           AssessmentCandidateRepository assessmentCandidateRepository,
                           PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.candidateRepository = candidateRepository;
        this.assessmentRepository = assessmentRepository;
        this.assessmentCandidateRepository = assessmentCandidateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("DEBUG: DataInitializer is running...");
        
        Admin admin;
        if (adminRepository.count() == 0) {
            admin = Admin.builder()
                    .name("Main Admin")
                    .email("admin@proctoring.com")
                    .password(passwordEncoder.encode("admin123"))
                    .build();
            admin = adminRepository.save(admin);
            System.out.println("DEBUG: Default admin user seeded: admin@proctoring.com / admin123");
        } else {
            admin = adminRepository.findAll().get(0);
            System.out.println("DEBUG: Admin already exists, using existing admin: " + admin.getEmail());
        }

        if (assessmentCandidateRepository.count() == 0) {
            // Seed sample assessment
            Assessment assessment = Assessment.builder()
                    .title("Sample Java Assessment")
                    .description("A test assessment for certification.")
                    .durationMinutes(30)
                    .status(Assessment.AssessmentStatus.ACTIVE)
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusDays(7))
                    .createdBy(admin)
                    .build();
            assessment = assessmentRepository.save(assessment);

            // Seed sample candidate
            Candidate candidate = Candidate.builder()
                    .name("Sample Candidate")
                    .firstName("Sample")
                    .lastName("Candidate")
                    .email("candidate@example.com")
                    .status(Candidate.CandidateStatus.INVITED)
                    .build();
            candidate = candidateRepository.save(candidate);

            // Link candidate to assessment (candidate123)
            AssessmentCandidate ac1 = new AssessmentCandidate();
            ac1.setAssessment(assessment);
            ac1.setCandidate(candidate);
            ac1.setUsername("candidate123");
            ac1.setPassword("password123");
            ac1.setTestToken(UUID.randomUUID().toString());
            ac1.setTokenExpiresAt(LocalDateTime.now().plusDays(7));
            assessmentCandidateRepository.save(ac1);

            // Link same candidate or new one to CA2602
            AssessmentCandidate ac2 = new AssessmentCandidate();
            ac2.setAssessment(assessment);
            ac2.setCandidate(candidate);
            ac2.setUsername("CA2602");
            ac2.setPassword("password123");
            ac2.setTestToken(UUID.randomUUID().toString());
            ac2.setTokenExpiresAt(LocalDateTime.now().plusDays(7));
            assessmentCandidateRepository.save(ac2);

            System.out.println("DEBUG: Sample candidates seeded: candidate123/password123 and CA2602/password123");
        } else {
            System.out.println("DEBUG: Candidate data already exists. Count: " + assessmentCandidateRepository.count());
        }
    }
}
