package com.proctoring.security;

import com.proctoring.model.Admin;
import com.proctoring.repository.AdminRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;

    public AdminUserDetailsService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Support for HR demo user
        if ("hr@proctoring.com".equals(email)) {
            return new User(
                    "hr@proctoring.com",
                    "hr123", // Password doesn't matter much here as JwtAuthFilter only uses it for
                             // validation if needed,
                             // but AuthService already validated credentials before issuing the token.
                    List.of(new SimpleGrantedAuthority("ROLE_HR")));
        }

        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found: " + email));
        return new User(
                admin.getEmail(),
                admin.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }
}
