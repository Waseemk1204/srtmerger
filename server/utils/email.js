import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
    // Check if credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail', // Assuming Gmail based on "App Password"
        auth: {
            user: process.env.EMAIL_USER?.trim(),
            pass: process.env.EMAIL_APP_PASSWORD?.replace(/\s+/g, ''),
        },
    });
};

export const sendResetPasswordEmail = async (email, resetUrl) => {
    // Try Resend first
    if (resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: 'SRT Merger <noreply@srtmerger.com>',
                to: email,
                subject: 'Reset Your Password - SRT Merger',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Reset Your Password</h2>
                    <p>You requested a password reset for your SRT Merger account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
                </div>
            `
            });

            if (error) {
                console.error('Resend API returned error:', error);
                // Fall through to SMTP
            } else {
                console.log('Email sent via Resend:', data.id);
                return true;
            }
        } catch (error) {
            console.error('Resend failed, falling back to SMTP:', error);
            // Fall through to SMTP
        }
    }

    const transporter = createTransporter();

    if (!transporter) {
        console.log(`[DEV] Password Reset Link for ${email}: ${resetUrl}`);
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'SRT Merger'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Password - SRT Merger',
            text: `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Reset Your Password</h2>
                    <p>You requested a password reset for your SRT Merger account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
                </div>
            `,
        });

        console.log('Message sent: %s', info.messageId);
        console.log('SMTP Response: %s', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
