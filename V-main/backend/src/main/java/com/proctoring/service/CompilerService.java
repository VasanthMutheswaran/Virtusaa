package com.proctoring.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class CompilerService {

    private static final Logger log = LoggerFactory.getLogger(CompilerService.class);

    public CompilerService() {
    }

    public CompilerResult executeCode(String sourceCode, String language,
            String input, String expectedOutput) {

        String lang = language.toLowerCase();
        log.info("Executing local code for language: {}", lang);

        try {
            if (lang.equals("python")) {
                return executePython(sourceCode, input, expectedOutput);
            } else if (lang.equals("java")) {
                return executeJava(sourceCode, input, expectedOutput);
            } else if (lang.equals("javascript") || lang.equals("node") || lang.equals("js")) {
                return executeNode(sourceCode, input, expectedOutput);
            } else {
                return new CompilerResult("ERROR", "",
                        "Local execution only supports Python, Java, and JavaScript currently.");
            }
        } catch (Exception e) {
            log.error("Local compiler error: {}", e.getMessage());
            return new CompilerResult("ERROR", "", e.getMessage());
        }
    }

    private CompilerResult executePython(String sourceCode, String input, String expectedOutput) throws Exception {
        Path tempFile = Files.createTempFile("script_", ".py");
        Files.writeString(tempFile, sourceCode);

        try {
            log.info("Executing Python code using 'python' command...");
            ProcessBuilder pb = new ProcessBuilder("python", tempFile.toString());
            // Try 'python' first, fallback to 'python3' if it fails with IOException
            try {
                return runProcess(pb, input, expectedOutput);
            } catch (IOException e) {
                log.warn("Failed to find 'python' command, trying 'python3'...");
                pb = new ProcessBuilder("python3", tempFile.toString());
                return runProcess(pb, input, expectedOutput);
            }
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    private CompilerResult executeNode(String sourceCode, String input, String expectedOutput) throws Exception {
        Path tempFile = Files.createTempFile("script_", ".js");
        Files.writeString(tempFile, sourceCode);

        try {
            log.info("Executing Node.js code...");
            ProcessBuilder pb = new ProcessBuilder("node", tempFile.toString());
            return runProcess(pb, input, expectedOutput);
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    private CompilerResult executeJava(String sourceCode, String input, String expectedOutput) throws Exception {
        // For Java, we need a specific class name. We'll try to extract it or use
        // 'Main'
        String className = "Main";
        if (sourceCode.contains("class ")) {
            int idx = sourceCode.indexOf("class ") + 6;
            int end = sourceCode.indexOf("{", idx);
            if (end > idx) {
                className = sourceCode.substring(idx, end).trim().split("\\s+")[0];
            }
        }

        Path tempDir = Files.createTempDirectory("java_exec_");
        Path javaFile = tempDir.resolve(className + ".java");
        Files.writeString(javaFile, sourceCode);

        try {
            // Compile
            ProcessBuilder compilePb = new ProcessBuilder("javac", javaFile.toString());
            Process compileProcess = compilePb.start();
            boolean compiled = compileProcess.waitFor(10, TimeUnit.SECONDS);

            if (!compiled || compileProcess.exitValue() != 0) {
                String error = new String(compileProcess.getErrorStream().readAllBytes());
                return new CompilerResult("COMPILATION_ERROR", "", error);
            }

            // Run
            ProcessBuilder runPb = new ProcessBuilder("java", "-cp", tempDir.toString(), className);
            return runProcess(runPb, input, expectedOutput);
        } finally {
            // Cleanup directory
            try (var stream = Files.walk(tempDir)) {
                stream.sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
        }
    }

    private CompilerResult runProcess(ProcessBuilder pb, String input, String expectedOutput) throws Exception {
        log.info("Starting process: {}", String.join(" ", pb.command()));
        Process process = pb.start();

        // Write input to stdin
        if (input != null && !input.isEmpty()) {
            log.debug("Writing input to stdin: {}", input);
            try (OutputStream os = process.getOutputStream();
                    BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os))) {
                writer.write(input);
                writer.flush();
            }
        }

        // Read output
        log.debug("Waiting for process to finish...");
        boolean finished = process.waitFor(5, TimeUnit.SECONDS);
        if (!finished) {
            log.warn("Process timed out (5s): {}", String.join(" ", pb.command()));
            process.destroyForcibly();
            return new CompilerResult("TIME_LIMIT_EXCEEDED", "", "Execution timed out (5s)");
        }

        String stdout = new String(process.getInputStream().readAllBytes());
        String stderr = new String(process.getErrorStream().readAllBytes());
        log.info("Process finished. Exit code: {}", process.exitValue());

        if (!stderr.isEmpty()) {
            log.warn("Process stderr: {}", stderr);
        }

        boolean isCorrect = true;
        if (expectedOutput != null && !expectedOutput.trim().isEmpty()) {
            isCorrect = stdout.trim().equals(expectedOutput.trim());
        }

        String verdict;
        if (process.exitValue() != 0) {
            verdict = "RUNTIME_ERROR";
        } else if (expectedOutput != null && !expectedOutput.trim().isEmpty()) {
            verdict = isCorrect ? "ACCEPTED" : "WRONG_ANSWER";
        } else {
            verdict = "ACCEPTED"; // For simple "Run" without test cases
        }

        log.info("Final verdict: {}", verdict);

        return new CompilerResult(verdict, stdout, stderr);
    }

    public record CompilerResult(String verdict, String output, String error) {
    }
}
