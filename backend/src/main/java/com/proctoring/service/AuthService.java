package com.proctoring.service;

import com.proctoring.dto.AuthRequest;
import com.proctoring.dto.AuthResponse;
import com.proctoring.model.Admin;
import com.proctoring.model.AssessmentCandidate;
import com.proctoring.repository.AdminRepository;
import com.proctoring.repository.AssessmentCandidateRepository;
import com.proctoring.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class AuthService {

    private final AdminRepository adminRepository;
    private final AssessmentCandidateRepository assessmentCandidateRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AdminRepository adminRepository,
            AssessmentCandidateRepository assessmentCandidateRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.assessmentCandidateRepository = assessmentCandidateRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse adminLogin(AuthRequest request) {
        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(admin.getEmail(), "ADMIN");

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setRole("ADMIN");
        response.setName(admin.getName());
        response.setId(admin.getId());
        return response;
    }

    public AuthResponse hrLogin(AuthRequest request) {
        // Special case for HR demo login
        if ("hr@proctoring.com".equals(request.getEmail()) && "hr123".equals(request.getPassword())) {
            String token = jwtUtil.generateToken("hr@proctoring.com", "HR");
            AuthResponse response = new AuthResponse();
            response.setToken(token);
            response.setRole("HR");
            response.setName("HR Manager");
            response.setId(999L);
            return response;
        }
        throw new RuntimeException("Invalid email or password");
    }

    public AuthResponse verifyCandidateToken(String token) {
        AssessmentCandidate ac = assessmentCandidateRepository.findByTestToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        String jwt = jwtUtil.generateToken(ac.getCandidate().getEmail(), "CANDIDATE");

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setRole("CANDIDATE");
        response.setName(ac.getCandidate().getName());
        response.setId(ac.getCandidate().getId());
        return response;
    }

    public void registerAdmin(com.proctoring.dto.AdminRegistrationDTO dto) {
        if (adminRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        Admin admin = new Admin();
        admin.setEmail(dto.getEmail());
        admin.setName(dto.getName());
        admin.setPassword(passwordEncoder.encode(dto.getPassword()));
        adminRepository.save(admin);
    }
}
