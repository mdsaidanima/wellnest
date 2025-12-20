package com.wellnest.wellnest.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            if (mailSender == null) {
                // For development: Just log the OTP instead of sending email
                System.out.println("===========================================");
                System.out.println("EMAIL SERVICE NOT CONFIGURED");
                System.out.println("OTP for " + toEmail + " is: " + otp);
                System.out.println("===========================================");
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@wellnest.com");
            helper.setTo(toEmail);
            helper.setSubject("WellNest - Password Reset OTP");

            // Create HTML email content
            String htmlContent = createOtpEmailHtml(otp);
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            System.out.println("✅ OTP email sent successfully to: " + toEmail);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send email: " + e.getMessage());
            e.printStackTrace();
            // Still log to console for development
            System.out.println("===========================================");
            System.out.println("EMAIL SENDING FAILED - OTP for " + toEmail + " is: " + otp);
            System.out.println("===========================================");
            
            // THROW the error so the frontend knows it failed
            throw new RuntimeException("Failed to send email. Check credentials.");
        }
    }

    private String createOtpEmailHtml(String otp) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }");
        html.append(".email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }");
        html.append(".header { background: linear-gradient(135deg, #18b046 0%, #14932a 100%); color: #ffffff; padding: 30px; text-align: center; }");
        html.append(".header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }");
        html.append(".content { padding: 40px 30px; color: #333333; }");
        html.append(".content h2 { color: #18b046; margin-top: 0; }");
        html.append(".otp-box { background-color: #f8f9fa; border: 2px dashed #18b046; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }");
        html.append(".otp-code { font-size: 36px; font-weight: bold; color: #18b046; letter-spacing: 8px; font-family: 'Courier New', monospace; }");
        html.append(".reset-link { display: inline-block; margin: 20px 0; padding: 14px 30px; background-color: #18b046; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; transition: background-color 0.3s; }");
        html.append(".reset-link:hover { background-color: #14932a; }");
        html.append(".info-text { color: #666666; font-size: 14px; line-height: 1.6; margin: 15px 0; }");
        html.append(".warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }");
        html.append(".footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666666; font-size: 12px; border-top: 1px solid #e0e0e0; }");
        html.append(".footer a { color: #18b046; text-decoration: none; }");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        html.append("<div class=\"email-container\">");
        html.append("<div class=\"header\">");
        html.append("<h1>🏋️ WELLNEST</h1>");
        html.append("<p style=\"margin: 5px 0 0 0; font-size: 14px;\">Smart Health & Fitness Companion</p>");
        html.append("</div>");
        html.append("<div class=\"content\">");
        html.append("<h2>Password Reset Request</h2>");
        html.append("<p>Hello,</p>");
        html.append("<p class=\"info-text\">We received a request to reset your WellNest account password. Use the OTP code below to complete the password reset process.</p>");
        html.append("<div class=\"otp-box\">");
        html.append("<p style=\"margin: 0 0 10px 0; color: #666; font-size: 14px;\">Your OTP Code:</p>");
        html.append("<div class=\"otp-code\">").append(otp).append("</div>");
        html.append("<p style=\"margin: 10px 0 0 0; color: #999; font-size: 12px;\">Valid for 10 minutes</p>");
        html.append("</div>");
        html.append("<p class=\"info-text\">Alternatively, you can click the button below to reset your password directly:</p>");
        html.append("<div style=\"text-align: center;\">");
        html.append("<a href=\"http://localhost:8080/login.html\" class=\"reset-link\">Reset Password Now</a>");
        html.append("</div>");
        html.append("<div class=\"warning\"><strong>⚠️ Security Notice:</strong><br>If you didn't request this password reset, please ignore this email. Your account remains secure.</div>");
        html.append("<p class=\"info-text\"><strong>Need help?</strong> Contact our support team if you have any questions.</p>");
        html.append("</div>");
        html.append("<div class=\"footer\">");
        html.append("<p>© 2025 WellNest - Smart Health & Fitness Companion</p>");
        html.append("<p><a href=\"http://localhost:8080\">Visit Website</a> | <a href=\"mailto:support@wellnest.com\">Contact Support</a></p>");
        html.append("<p style=\"margin-top: 15px; color: #999;\">This is an automated email. Please do not reply to this message.</p>");
        html.append("</div>");
        html.append("</div>");
        html.append("</body>");
        html.append("</html>");
        
        return html.toString();
    }
}
