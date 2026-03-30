package com.proctoring.controller;

import com.proctoring.dto.AuthRequest;
import com.proctoring.dto.AuthResponse;
import com.proctoring.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.adminLogin(request));
    }

    @PostMapping("/hr/login")
    public ResponseEntity<AuthResponse> hrLogin(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.hrLogin(request));
    }

    @PostMapping("/admin/register")
    public ResponseEntity<String> register(@Valid @RequestBody com.proctoring.dto.AdminRegistrationDTO request) {
        authService.registerAdmin(request);
        return ResponseEntity.ok("Admin registered successfully");
    }

    @PostMapping("/candidate/verify")
    public ResponseEntity<AuthResponse> candidateVerify(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.verifyCandidateToken(token));
    }
}
