package com.proctoring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ProctoringApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProctoringApplication.class, args);
    }
}
