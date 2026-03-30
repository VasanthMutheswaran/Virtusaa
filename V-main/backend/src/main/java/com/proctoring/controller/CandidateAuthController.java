package com.proctoring.controller;

import com.proctoring.dto.CandidateLoginRequest;
import com.proctoring.dto.CandidateProfileRequest;
import com.proctoring.model.Candidate;
import com.proctoring.repository.AssessmentCandidateRepository;
import com.proctoring.repository.CandidateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/candidate")
@CrossOrigin(origins = "*")
public class CandidateAuthController {

    private final AssessmentCandidateRepository assessmentCandidateRepository;
    private final CandidateRepository candidateRepository;
    private final String uploadDir = "uploads/resumes";

    public CandidateAuthController(AssessmentCandidateRepository assessmentCandidateRepository,
            CandidateRepository candidateRepository) {
        this.assessmentCandidateRepository = assessmentCandidateRepository;
        this.candidateRepository = candidateRepository;

        // Ensure upload directory exists
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody CandidateLoginRequest request) {
        System.out.println("DEBUG: Candidate login attempt - Username: " + request.getUsername() + ", Password: " + request.getPassword());
        return assessmentCandidateRepository.findByUsernameAndPassword(request.getUsername(), request.getPassword())
                .map(ac -> {
                    if (ac.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.status(401).body(Map.of("message", "Test session has expired"));
                    }
                    Map<String, Object> response = new HashMap<>();
                    response.put("token", ac.getTestToken());
                    response.put("candidateName", ac.getCandidate().getName());
                    response.put("assessmentTitle", ac.getAssessment().getTitle());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Invalid username or password")));
    }

    @PostMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestParam("token") String token,
            @RequestParam("data") String profileDataJson,
            @RequestParam(value = "resume", required = false) MultipartFile resume) {

        return assessmentCandidateRepository.findByTestToken(token)
                .map(ac -> {
                    try {
                        CandidateProfileRequest profileData = new ObjectMapper().readValue(profileDataJson,
                                CandidateProfileRequest.class);
                        Candidate candidate = ac.getCandidate();

                        java.util.Optional<Candidate> existingWithEmail = candidateRepository.findByEmail(profileData.getEmail());
                        if (existingWithEmail.isPresent() && !existingWithEmail.get().getId().equals(candidate.getId())) {
                            return ResponseEntity.status(400)
                                    .body(Map.of("message", "Email address is already registered to another user. Please use your original invited email."));
                        }

                        candidate.setFirstName(profileData.getFirstName());
                        candidate.setLastName(profileData.getLastName());
                        candidate.setEmail(profileData.getEmail());
                        candidate.setPhone(profileData.getPhone());
                        candidate.setCountryCode(profileData.getCountryCode());
                        candidate.setName(profileData.getFirstName() + " " + profileData.getLastName());

                        if (resume != null && !resume.isEmpty()) {
                            String fileName = UUID.randomUUID().toString() + "_" + resume.getOriginalFilename();
                            Path filePath = Paths.get(uploadDir, fileName);
                            Files.copy(resume.getInputStream(), filePath);
                            candidate.setResumeUrl("/api/auth/candidate/resumes/" + fileName);
                        }

                        candidateRepository.save(candidate);
                        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
                    } catch (IOException e) {
                        return ResponseEntity.internalServerError()
                                .body(Map.of("message", "Error updating profile: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Assessment session not found")));
    }

    @GetMapping("/resumes/{filename:.+}")
    public ResponseEntity<Resource> getResume(@PathVariable("filename") String filename) {
        try {
            Path path = Paths.get(uploadDir, filename);
            Resource resource = new UrlResource(path.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                if (filename.toLowerCase().endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (filename.toLowerCase().endsWith(".doc")) {
                    contentType = "application/msword";
                } else if (filename.toLowerCase().endsWith(".docx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else {
                    contentType = "application/octet-stream";
                }
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (IOException e) {
            System.err.println("ERROR: Could not serve resume: " + filename + " - " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
