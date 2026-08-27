package com.career.service;

public interface EmailService {

    void sendWelcomeEmail(String toEmail, String studentName);

    void sendTestResultEmail(String toEmail, String studentName, String testName,
                            String recommendedCareer, Integer score, String description);

    void sendEmail(String toEmail, String subject, String contentHtml);
}
