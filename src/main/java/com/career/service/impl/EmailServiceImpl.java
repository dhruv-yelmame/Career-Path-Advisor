package com.career.service.impl;

import com.career.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:noreply@careerpathadviser.com}")
    private String fromEmail;

    @Async
    @Override
    public void sendWelcomeEmail(String toEmail, String studentName) {
        String subject = "Welcome to CareerPath Adviser! 🚀";
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4361ee;">Welcome to CareerPath Adviser, %s! 👋</h2>
                    <p>We are thrilled to accompany you on your career discovery journey.</p>
                    <p>With our automated assessment engine, you can evaluate your skills, uncover your strengths, and receive personalized career path recommendations.</p>
                    <div style="margin: 25px 0;">
                        <a href="http://localhost:8080/student-login.html" style="background-color: #4361ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Dashboard</a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888;">CareerPath Adviser Team &bull; Guiding your future step by step</p>
                </div>
                """.formatted(studentName);

        sendEmail(toEmail, subject, content);
    }

    @Async
    @Override
    public void sendTestResultEmail(String toEmail, String studentName, String testName,
                                    String recommendedCareer, Integer score, String description) {
        String subject = "Your Career Assessment Results: " + recommendedCareer + " 🎯";
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4361ee;">Congratulations, %s! 🎉</h2>
                    <p>You have successfully completed <strong>%s</strong>.</p>
                    <div style="background-color: #f0f4ff; border-left: 4px solid #4361ee; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="margin-top: 0; color: #1e3a8a;">Recommended Career: %s</h3>
                        <p style="margin: 5px 0;"><strong>Total Score:</strong> %d points</p>
                        <p style="margin: 5px 0; color: #475569;">%s</p>
                    </div>
                    <div style="margin: 25px 0;">
                        <a href="http://localhost:8080/result.html" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Analysis & Insights</a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888;">CareerPath Adviser Team &bull; Guiding your future step by step</p>
                </div>
                """.formatted(studentName, testName, recommendedCareer, score != null ? score : 0, description);

        sendEmail(toEmail, subject, content);
    }

    @Async
    @Override
    public void sendEmail(String toEmail, String subject, String contentHtml) {
        if (!mailEnabled || mailSender == null) {
            log.info("[SIMULATED EMAIL] To: {} | Subject: {} | App Mail is in simulation/offline mode", toEmail, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(contentHtml, true);

            mailSender.send(message);
            log.info("Email dispatched successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}
