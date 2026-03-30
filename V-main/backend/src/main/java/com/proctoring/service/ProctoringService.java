package com.proctoring.service;

import com.proctoring.dto.ProctoringEventDTO;
import com.proctoring.model.ExamSession;
import com.proctoring.model.ProctoringLog;
import com.proctoring.repository.ExamSessionRepository;
import com.proctoring.repository.ProctoringLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProctoringService {

    private final ProctoringLogRepository proctoringLogRepository;
    private final ExamSessionRepository examSessionRepository;

    public ProctoringService(ProctoringLogRepository proctoringLogRepository,
            ExamSessionRepository examSessionRepository) {
        this.proctoringLogRepository = proctoringLogRepository;
        this.examSessionRepository = examSessionRepository;
    }

    public void logViolation(ProctoringEventDTO dto) {
        ExamSession session = examSessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        ProctoringLog log = ProctoringLog.builder()
                .session(session)
                .violationType(dto.getViolationType())
                .severity(dto.getSeverity())
                .description(dto.getDescription())
                .screenshotUrl(dto.getScreenshotBase64())
                .matchScore(dto.getMatchScore())
                .occurredAt(LocalDateTime.now())
                .build();

        proctoringLogRepository.save(log);
    }

    public Map<String, Long> getGlobalViolationStats() {
        List<Object[]> rows = proctoringLogRepository.countByViolationType();
        // Initialise all known categories to 0 so the frontend always gets full data
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("TAB_SWITCH", 0L);
        stats.put("PHONE_DETECTED", 0L);
        stats.put("MULTIPLE_FACES", 0L);
        stats.put("NO_FACE", 0L);
        stats.put("WINDOW_BLUR", 0L);
        stats.put("LOOKING_AWAY", 0L);
        for (Object[] row : rows) {
            String type = (String) row[0];
            Long count = (Long) row[1];
            if (stats.containsKey(type)) {
                stats.put(type, count);
            }
        }
        return stats;
    }
}
