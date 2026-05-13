import transporter from '../config/mail';
import dotenv from 'dotenv';

dotenv.config();

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Generic function to send email matching WettenHalls pattern
 */
export const sendEmail = async (options: SendEmailOptions) => {
  const mailOptions: any = {
    from: `"CourseEdu" <${process.env.SMTP_FROM}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendActivationEmail = async (email: string, token: string) => {
  const activationUrl = `${process.env.CLIENT_URL}/activate/${token}`;

  await sendEmail({
    to: email,
    subject: 'Activate your CourseEdu account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1;">Welcome to CourseEdu!</h2>
        <p>Please click the button below to activate your account. This link will expire in 24 hours.</p>
        <a href="${activationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Activate Account</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't sign up for this account, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your CourseEdu password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>You requested to reset your password. Please click the button below to continue. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendInstructorApprovalEmail = async (email: string, name: string) => {
  await sendEmail({
    to: email,
    subject: 'Congratulations! You are now an Instructor',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">Welcome to the Team!</h2>
        <p>Dear ${name},</p>
        <p>We are thrilled to inform you that your instructor application has been <strong>APPROVED</strong>.</p>
        <p>You can now log in to your dashboard and start creating amazing courses for our students.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you have any questions, feel free to reply to this email.</p>
      </div>
    `,
  });
};

export const sendInstructorRejectionEmail = async (email: string, name: string, reason: string) => {
  await sendEmail({
    to: email,
    subject: 'Update on your Instructor Application',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444;">Application Update</h2>
        <p>Dear ${name},</p>
        <p>Thank you for your interest in becoming an instructor at CourseEdu.</p>
        <p>After careful review, we regret to inform you that we cannot approve your application at this time.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Reason for rejection:</strong></p>
          <p style="margin: 5px 0 0 0; color: #7f1d1d;">${reason}</p>
        </div>
        <p>You are welcome to apply again in the future once you have addressed the feedback above.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Best regards,<br/>The CourseEdu Team</p>
      </div>
    `,
  });
};
