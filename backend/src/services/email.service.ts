import nodemailer from 'nodemailer';

const getTransporter = () => {
  const user = process.env.SMTP_USER || 'kukukaramjit@gmail.com';
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
};

export const sendVerificationEmail = async (to: string, code: string) => {
  const user = process.env.SMTP_USER || 'kukukaramjit@gmail.com';
  const pass = process.env.SMTP_PASS;

  if (!pass) {
    console.log(`[MOCK EMAIL SERVICE] No SMTP credentials configured. Simulating verification email to ${to}: ${code}`);
    return;
  }

  const transporter = getTransporter();
  const mailOptions = {
    from: `"TaxCompute Admin" <${user}>`,
    to,
    subject: 'Verify Your Email Address - TaxCompute',
    text: `Your email verification code is: ${code}. It is valid for 15 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1d4ed8; text-align: center; margin-bottom: 24px;">Email Verification Code</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #4b5563;">Thank you for registering at TaxCompute. Please use the following 6-digit verification code to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; background-color: #eff6ff; color: #1e40af; padding: 15px 30px; border-radius: 8px; display: inline-block; letter-spacing: 4px; border: 1px solid #bfdbfe;">
            ${code}
          </div>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">This code is valid for 15 minutes. If you did not register for an account, please ignore this message.</p>
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="font-size: 11px; text-align: center; color: #9ca3af;">Secured by JWT & AES Data Encryption</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Verification email sent from ${user} to ${to}`);
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${to}:`, err);
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const user = process.env.SMTP_USER || 'kukukaramjit@gmail.com';
  const pass = process.env.SMTP_PASS;

  if (!pass) {
    console.log(`[MOCK EMAIL SERVICE] No SMTP credentials. Simulating password reset link for ${to}. Token: ${token}`);
    return;
  }

  const transporter = getTransporter();
  const resetUrl = `http://localhost:3000/auth/reset-password?token=${token}`;
  const mailOptions = {
    from: `"TaxCompute Admin" <${user}>`,
    to,
    subject: 'Reset Your Password - TaxCompute',
    text: `Click the following link to reset your password: ${resetUrl}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1d4ed8; text-align: center; margin-bottom: 24px;">Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #4b5563;">We received a request to reset your password. Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; transition: background-color 0.2s;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">This link is valid for 15 minutes. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="font-size: 11px; text-align: center; color: #9ca3af;">Secured by JWT & AES Data Encryption</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Password reset email sent from ${user} to ${to}`);
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset email to ${to}:`, err);
  }
};
