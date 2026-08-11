const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER || 'netharavidmantha54@gmail.com';
  const pass = process.env.APP_PASSWORD || 'gfvmetthoeutxyzk';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetEmail = async (toEmail, otpCode, recipientName = 'Valued Customer') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"TaskLanka Support" <${process.env.EMAIL_USER || 'netharavidmantha54@gmail.com'}>`,
      to: toEmail,
      subject: `🔑 ${otpCode} is your TaskLanka Password Reset Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0D5C75; margin: 0; font-size: 26px;">Task<span style="color: #F59E0B;">ලංකා</span></h1>
            <p style="color: #64748B; font-size: 13px; margin-top: 4px;">Smart Service Marketplace • Sri Lanka</p>
          </div>

          <div style="background: #FFFFFF; padding: 24px; border-radius: 12px; border: 1px solid #CBD5E1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="color: #1E293B; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.5;">
              Hello <strong>${recipientName}</strong>,<br>
              We received a request to reset your TaskLanka account password. Use the 6-digit verification code below to complete your reset:
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <div style="display: inline-block; background: #0D5C75; color: #FFFFFF; font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 14px 28px; border-radius: 8px; border: 2px solid #F59E0B;">
                ${otpCode}
              </div>
            </div>

            <p style="color: #64748B; font-size: 12px; line-height: 1.4; margin-bottom: 0;">
              ⏱️ This code will expire in <strong>15 minutes</strong>. If you did not request this password reset, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #94A3B8; font-size: 11px;">
            &copy; 2026 TaskLanka (Pvt) Ltd. All rights reserved. • Colombo, Sri Lanka
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Password reset OTP sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service Error] Failed to send password reset email:', error);
    throw new Error(`Failed to send reset email: ${error.message}`);
  }
};

module.exports = {
  sendPasswordResetEmail
};
