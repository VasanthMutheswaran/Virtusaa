package com.proctoring.controller;

import com.proctoring.model.MicroOralSubmission;
import com.proctoring.service.MicroOralService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/oral")
@CrossOrigin(origins = "*")
public class MicroOralController {

    private final MicroOralService oralService;

    public MicroOralController(MicroOralService oralService) {
        this.oralService = oralService;
    }

    @PostMapping("/submit")
    public ResponseEntity<MicroOralSubmission> submitAnswer(@RequestBody Map<String, Object> request) {
        Long sessionId = Long.valueOf(request.get("sessionId").toString());
        String questionText = (String) request.get("questionText");
        String topic = (String) request.get("topic");
        String transcript = (String) request.get("transcript");

        MicroOralSubmission submission = oralService.submitOralAnswer(sessionId, questionText, topic, transcript);
        return ResponseEntity.ok(submission);
    }

    @GetMapping("/admin/submissions/{sessionId}")
    public ResponseEntity<?> getSubmissions(@PathVariable("sessionId") String sessionIdStr) {
        try {
            Long sessionId = Long.parseLong(sessionIdStr);
            List<MicroOralSubmission> submissions = oralService.getSubmissionsBySession(sessionId);
            return ResponseEntity.ok(submissions);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid sessionId format: " + sessionIdStr);
        }
    }
}
