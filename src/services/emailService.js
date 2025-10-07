import nodemailer from "nodemailer";
import "dotenv/config"

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Create reusable transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Send Verification Email
 */
export const sendVerificationEmail = async (email, firstName, token) => {
  try {
    const verificationLink = `${FRONTEND_URL}/auth/verify-email/${token}`;
    const mailOptions = {
      from: `"Expense Manager" <${EMAIL_USER}>`,
      to: email,
      subject: "Verify your email - Expense Manager",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome, ${firstName}!</h2>
          <p>Thanks for registering on <b>Expense Manager</b>.</p>
          <p>Please click the button below to verify your email:</p>
          <a href="${verificationLink}" 
            style="background-color: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
            Verify Email
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationLink}</p>
          <br/>
          <p>– The Expense Manager Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async (email, firstName, token) => {
  try {
    const resetLink = `${FRONTEND_URL}/auth/reset-password/${token}`;
    const mailOptions = {
      from: `"Expense Manager" <${EMAIL_USER}>`,
      to: email,
      subject: "Reset your password - Expense Manager",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hello, ${firstName}</h2>
          <p>We received a request to reset your password.</p>
          <p>Click the button below to reset it. The link expires in <b>15 minutes</b>.</p>
          <a href="${resetLink}" 
            style="background-color: #ef4444; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
            Reset Password
          </a>
          <p>If you didn’t request this, just ignore this email.</p>
          <br/>
          <p>– The Expense Manager Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Optional Welcome Email
 */
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const mailOptions = {
      from: `"Expense Manager" <${EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Expense Manager 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome aboard, ${firstName}!</h2>
          <p>We’re excited to have you with us. Start managing your expenses smartly today.</p>
          <br/>
          <p>– The Expense Manager Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error("⚠️ Error sending welcome email:", error);
    // Not critical — don’t throw
  }
};
