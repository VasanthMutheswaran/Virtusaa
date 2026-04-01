package com.proctoring.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  @Async
  public void sendTestInvitation(String toEmail, String candidateName,
      String assessmentTitle, String username, String password,
      String frontendUrl) {
    try {
      log.info("Preparing to send invitation to {} from {}", toEmail, fromEmail);
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true);

      helper.setFrom(fromEmail, "AI Proctoring Platform");
      helper.setTo(toEmail);
      helper.setSubject("You're Invited: " + assessmentTitle + " - Assessment");

      String testLink = frontendUrl + "/candidate/login";
      log.debug("Built test link: {}", testLink);
      String htmlContent = buildInvitationEmail(candidateName, assessmentTitle, username, password, testLink);

      helper.setText(htmlContent, true);
      log.info("Attempting to send message...");
      mailSender.send(message);
      log.info("Invitation successfully sent to {}", toEmail);
    } catch (Exception e) {
      log.error("CRITICAL: Failed to send email to {}. Exception: {}, Message: {}", toEmail, e.getClass().getName(),
          e.getMessage());
      e.printStackTrace();
    }
  }

  @Async
  public void sendWelcomeEmail(String toEmail, String candidateName) {
    try {
      log.info("Sending welcome email to {}", toEmail);
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true);

      helper.setFrom(fromEmail, "AI Proctoring Platform");
      helper.setTo(toEmail);
      helper.setSubject("Welcome to AI Proctoring Platform");

      String htmlContent = buildWelcomeEmail(candidateName);
      helper.setText(htmlContent, true);
      mailSender.send(message);
      log.info("Welcome email sent to {}", toEmail);
    } catch (Exception e) {
      log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
    }
  }

  @Async
  public void sendResultNotification(String toEmail, String candidateName,
      int totalScore, String verdict) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true);

      helper.setFrom(fromEmail);
      helper.setTo(toEmail);
      helper.setSubject("Assessment Result - " + verdict);

      String htmlContent = buildResultEmail(candidateName, totalScore, verdict);
      helper.setText(htmlContent, true);
      mailSender.send(message);
    } catch (MessagingException e) {
      log.error("Failed to send result email to {}: {}", toEmail, e.getMessage());
    }
  }

  private String buildInvitationEmail(String name, String title, String username, String password, String link) {
    return """
        <html>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 550px; margin: auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="background: #6d28d9; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 3px; font-weight: 900;">Assessment Portal</h1>
            </div>
            <div style="padding: 40px;">
              <p style="color: #64748b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Invitation for</p>
              <h2 style="color: #6d28d9; margin: 0 0 24px 0; font-size: 22px;">%s</h2>

              <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello <b>%s</b>, you have been registered for a secure assessment. Please use the following credentials to access the examination room.</p>

              <div style="background: #f5f3ff; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #ddd6fe;">
                <div style="margin-bottom: 16px;">
                  <span style="color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">Candidate ID</span>
                  <span style="color: #6d28d9; font-size: 18px; font-family: monospace; font-weight: 700;">%s</span>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">Access Password</span>
                  <span style="color: #6d28d9; font-size: 18px; font-family: monospace; font-weight: 700;">%s</span>
                </div>
              </div>

              <div style="margin-bottom: 32px;">
                <h3 style="color: #6d28d9; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; border-bottom: 2px solid #f5f3ff; padding-bottom: 8px;">Security Requirements</h3>
                <ul style="color: #475569; font-size: 13px; line-height: 1.8; padding-left: 20px; margin: 0;">
                  <li>Login via the secure portal link below.</li>
                  <li>Complete the mandatory System Integrity Check.</li>
                  <li>Ensure your camera and microphone are operational.</li>
                  <li>Switching tabs or exiting fullscreen will flag a violation.</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="%s" style="display: block; background: #6d28d9; color: white; padding: 18px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 4px 12px rgba(109,40,217,0.2);">Login to Assessment Room</a>
              </div>

              <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 32px; font-weight: 600;">Secure Delivery Protocol • Automated System Notification</p>
            </div>
          </div>
        </body>
        </html>
        """
        .formatted(title, name, username, password, link);
  }

  private String buildResultEmail(String name, int score, String verdict) {
    String color = "SELECTED".equals(verdict) ? "#22c55e" : "#ef4444";
    return """
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f6f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Assessment Result</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
              <h2>Hello, %s!</h2>
              <p>Your assessment has been evaluated.</p>
              <div style="margin-top: 30px; margin-bottom: 30px;">
                <div style="display: inline-block; background: %s; color: white; padding: 10px 24px; border-radius: 50px; font-size: 18px; font-weight: bold;">%s</div>
              </div>
              <p style="color: #666; margin-top: 20px;">Thank you for participating. Our team will contact you for next steps.</p>
            </div>
          </div>
        </body>
        </html>
        """
        .formatted(name, color, verdict);
  }

  private String buildWelcomeEmail(String name) {
    return """
        <html>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 550px; margin: auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="background: #1e40af; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 3px; font-weight: 900;">Welcome!</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #1e40af; margin: 0 0 24px 0; font-size: 22px;">Hello %s</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your account has been successfully created on the <b>AI Proctoring Platform</b>.</p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">You will receive separate invitation emails for any assessments assigned to you.</p>
              <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; pt: 24px;">
                <p style="color: #94a3b8; font-size: 11px; text-align: center; font-weight: 600;">Secure Delivery Protocol • Automated System Notification</p>
              </div>
            </div>
          </div>
        </body>
        </html>
        """.formatted(name);
  }
}
