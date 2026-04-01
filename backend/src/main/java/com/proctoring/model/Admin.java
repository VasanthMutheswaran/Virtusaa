package com.proctoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admins")
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Admin() {
    }

    public static class AdminBuilder {
        private Admin instance = new Admin();

        public AdminBuilder id(Long id) {
            instance.setId(id);
            return this;
        }

        public AdminBuilder name(String n) {
            instance.setName(n);
            return this;
        }

        public AdminBuilder email(String e) {
            instance.setEmail(e);
            return this;
        }

        public AdminBuilder password(String p) {
            instance.setPassword(p);
            return this;
        }

        public Admin build() {
            return instance;
        }
    }

    public static AdminBuilder builder() {
        return new AdminBuilder();
    }
}
