/**
 * @project AI-Powered Proctoring & Automated Assessment System
 * @version Virtusa Jatayu Season 5 - Stage 2 (POC)
 * @description Service handles result calculation, penalty logic based on 
 *              proctoring violations, and automated candidate notifications.
 * @author <YOUR_TEAM_NAME>
 */
package com.proctoring.service;

import com.proctoring.dto.ProctoringLogDTO;
import com.proctoring.dto.ResultDTO;
import com.proctoring.model.ExamSession;
import com.proctoring.model.ProctoringLog;
import com.proctoring.model.Result;
import com.proctoring.repository.ExamSessionRepository;
import com.proctoring.repository.ProctoringLogRepository;
import com.proctoring.repository.ResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ResultService {

    private final ResultRepository resultRepository;
    private final ProctoringLogRepository proctoringLogRepository;
    private final ExamSessionRepository examSessionRepository;
    private final EmailService emailService;

    public ResultService(ResultRepository resultRepository,
            ProctoringLogRepository proctoringLogRepository,
            ExamSessionRepository examSessionRepository,
            EmailService emailService) {
        this.resultRepository = resultRepository;
        this.proctoringLogRepository = proctoringLogRepository;
        this.examSessionRepository = examSessionRepository;
        this.emailService = emailService;
    }

    public List<ResultDTO> getResultsByAssessment(Long assessmentId) {
        List<ResultDTO> completedResults = resultRepository.findAll().stream()
                .filter(r -> r.getSession() != null && r.getSession().getAssessmentCandidate() != null
                        && r.getSession().getAssessmentCandidate().getAssessment().getId().equals(assessmentId))
                .map(r -> {
                    try {
                        return mapToDTO(r);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        List<ResultDTO> activeSessions = examSessionRepository
                .findByStatus(com.proctoring.model.ExamSession.SessionStatus.IN_PROGRESS).stream()
                .filter(s -> s.getAssessmentCandidate() != null
                        && s.getAssessmentCandidate().getAssessment().getId().equals(assessmentId))
                .filter(s -> resultRepository.findBySessionId(s.getId()).isEmpty())
                .map(s -> {
                    try {
                        return mapSessionToDTO(s);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        completedResults.addAll(activeSessions);
        return completedResults;
    }

    public List<ResultDTO> getAllResults() {
        List<ResultDTO> completedResults = resultRepository.findAll().stream()
                .map(r -> {
                    try {
                        return mapToDTO(r);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(java.util.ArrayList::new));

        List<ResultDTO> activeSessions = examSessionRepository
                .findByStatus(com.proctoring.model.ExamSession.SessionStatus.IN_PROGRESS).stream()
                .filter(s -> resultRepository.findBySessionId(s.getId()).isEmpty())
                .map(s -> {
                    try {
                        return mapSessionToDTO(s);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        completedResults.addAll(activeSessions);
        return completedResults;
    }

    public List<ProctoringLogDTO> getProctoringLogs(Long sessionId) {
        return proctoringLogRepository.findBySessionId(sessionId).stream()
                .map(this::mapToLogDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResultDTO updateVerdictAndNotify(Long sessionId, String verdict) {
        Result result = resultRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Result not found for session " + sessionId));

        result.setVerdict(verdict);
        resultRepository.save(result);

        String candidateEmail = result.getSession().getAssessmentCandidate().getCandidate().getEmail();
        String candidateName = result.getSession().getAssessmentCandidate().getCandidate().getName();

        emailService.sendResultNotification(candidateEmail, candidateName, result.getTotalScore(), verdict);

        return mapToDTO(result);
    }

    @Transactional
    public void deleteResult(Long sessionId) {
        // Find session
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        // Delete associated proctoring logs
        List<ProctoringLog> logs = proctoringLogRepository.findBySessionId(sessionId);
        proctoringLogRepository.deleteAll(logs);

        // Delete result if exists
        resultRepository.findBySessionId(sessionId).ifPresent(resultRepository::delete);

        // Finally delete the session
        examSessionRepository.delete(session);
    }

    private ResultDTO mapToDTO(Result r) {
        ResultDTO dto = new ResultDTO();
        if (r == null)
            return dto;

        if (r.getSession() != null) {
            dto.setSessionId(r.getSession().getId());
            dto.setSubmittedAt(r.getSession().getSubmittedAt());

            if (r.getSession().getAssessmentCandidate() != null) {
                var ac = r.getSession().getAssessmentCandidate();
                if (ac.getCandidate() != null) {
                    var cand = ac.getCandidate();
                    dto.setCandidateName(cand.getName());
                    dto.setCandidateEmail(cand.getEmail());
                    dto.setFirstName(cand.getFirstName());
                    dto.setLastName(cand.getLastName());
                    dto.setPhone(cand.getPhone());
                    dto.setCountryCode(cand.getCountryCode());
                    dto.setResumeUrl(cand.getResumeUrl());
                }
            }
        }

        dto.setQuizScore(r.getQuizScore());
        dto.setQuizTotal(r.getQuizTotal());
        dto.setCodingScore(r.getCodingScore());
        dto.setCodingTotal(r.getCodingTotal());

        int oralScore = r.getOralScore();
        int oralTotal = r.getOralTotal();
        // Fix for existing results with inflated scores (0-100 scale instead of 0-10)
        if (oralTotal > 0 && oralScore > oralTotal) {
            oralScore = (int) Math.round(oralScore * 0.1);
        }

        dto.setOralScore(oralScore);
        dto.setOralTotal(oralTotal);
        dto.setTotalScore(r.getTotalScore());
        // Populate violation counts for detailed HR reporting
        dto.setViolationCount(r.getViolationCount());
        dto.setTabSwitchCount(r.getTabSwitchCount());
        dto.setPhoneCount(r.getPhoneCount());
        dto.setMultipleFacesCount(r.getMultipleFacesCount());
        dto.setNoFaceCount(r.getNoFaceCount());
        dto.setWindowBlurCount(r.getWindowBlurCount());
        dto.setLookingAwayCount(r.getLookingAwayCount());
        dto.setSuspiciousMovementCount(r.getSuspiciousMovementCount());
        dto.setVerdict(r.getVerdict());
        dto.setPersonMismatchCount(r.getPersonMismatchCount());
        if (r.getSession() != null) {
            dto.setReferencePhoto(r.getSession().getReferencePhoto());
        }
        return dto;
    }

    private ResultDTO mapSessionToDTO(ExamSession s) {
        ResultDTO dto = new ResultDTO();
        dto.setSessionId(s.getId());
        dto.setVerdict("IN_PROGRESS");

        if (s.getAssessmentCandidate() != null) {
            var ac = s.getAssessmentCandidate();
            if (ac.getCandidate() != null) {
                var cand = ac.getCandidate();
                dto.setCandidateName(cand.getName());
                dto.setCandidateEmail(cand.getEmail());
                dto.setFirstName(cand.getFirstName());
                dto.setLastName(cand.getLastName());
                dto.setPhone(cand.getPhone());
                dto.setCountryCode(cand.getCountryCode());
                dto.setResumeUrl(cand.getResumeUrl());
            }
        }

        // Count live violations from logs
        List<ProctoringLog> logs = proctoringLogRepository.findBySessionId(s.getId());
        dto.setViolationCount(logs.size());
        dto.setTabSwitchCount((int) logs.stream().filter(l -> "TAB_SWITCH".equals(l.getViolationType())).count());
        dto.setPhoneCount((int) logs.stream().filter(l -> "PHONE_DETECTED".equals(l.getViolationType())).count());
        dto.setMultipleFacesCount(
                (int) logs.stream().filter(l -> "MULTIPLE_FACES".equals(l.getViolationType())).count());
        dto.setNoFaceCount(
                (int) logs.stream().filter(l -> "NO_FACE".equals(l.getViolationType())).count());
        dto.setWindowBlurCount(
                (int) logs.stream().filter(l -> "WINDOW_BLUR".equals(l.getViolationType())).count());
        dto.setLookingAwayCount((int) logs.stream().filter(l -> "LOOKING_AWAY".equals(l.getViolationType())).count());
        dto.setSuspiciousMovementCount(
                (int) logs.stream().filter(l -> "SUSPICIOUS_MOVEMENT".equals(l.getViolationType())).count());
        dto.setPersonMismatchCount(
                (int) logs.stream().filter(l -> "PERSON_MISMATCH".equals(l.getViolationType())).count());
        dto.setReferencePhoto(s.getReferencePhoto());

        return dto;
    }

    private ProctoringLogDTO mapToLogDTO(ProctoringLog log) {
        ProctoringLogDTO dto = new ProctoringLogDTO();
        dto.setId(log.getId());
        dto.setViolationType(log.getViolationType());
        dto.setSeverity(log.getSeverity());
        dto.setDescription(log.getDescription());
        dto.setOccurredAt(log.getOccurredAt());
        dto.setScreenshotUrl(log.getScreenshotUrl());
        dto.setMatchScore(log.getMatchScore());
        return dto;
    }
}
