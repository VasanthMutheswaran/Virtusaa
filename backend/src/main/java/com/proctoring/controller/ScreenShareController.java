package com.proctoring.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Relays screen frames from exam candidates to the HR dashboard.
 *
 * Candidate sends to: /app/screen/{sessionId}
 * HR subscribes to: /topic/screen/{sessionId}
 */
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class ScreenShareController {
    private static final Logger log = LoggerFactory.getLogger(ScreenShareController.class);

    private final SimpMessagingTemplate messagingTemplate;

    public ScreenShareController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Receives a Base64-encoded JPEG frame from the candidate and
     * rebroadcasts it to all HR clients watching that session.
     */
    @MessageMapping("/screen/{sessionId}")
    public void relayFrame(@DestinationVariable("sessionId") String sessionId,
            @Payload String base64Frame) {
        log.debug("Received screen frame for session: {}, size: {} bytes", sessionId, base64Frame.length());
        messagingTemplate.convertAndSend("/topic/screen/" + sessionId, base64Frame);
    }
}
