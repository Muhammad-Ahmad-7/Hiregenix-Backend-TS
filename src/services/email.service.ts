import { Resend } from 'resend';
import fs from 'fs/promises';
import path, { dirname } from 'path';
import { config } from '../config/config.js';
import { fileURLToPath } from 'url';

export class EmailService {
    private static resend = new Resend(process.env.RESEND_API_KEY);

    private static getFromEmail(): string {
        return process.env.EMAIL_FROM || `"HireGenix" <noreply@mail.hiregenix.dev>`;
    }

    private static async getTemplate(templateName: string): Promise<string> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        return await fs.readFile(templatePath, 'utf-8');
    }

    private static replaceTemplateVariables(template: string, variables: Record<string, string>): string {
        return Object.entries(variables).reduce(
            (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), value),
            template
        );
    }

    static async verifyConnection(): Promise<boolean> {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.error('RESEND_API_KEY is missing');
                return false;
            }

            console.log('Resend API key found. Email service ready.');
            return true;
        } catch (error) {
            console.error('Resend verification failed:', error);
            return false;
        }
    }

    static async sendVerificationEmail(
        to: string,
        name: string,
        verificationToken: string
    ): Promise<void> {
        try {
            const template = await this.getTemplate('verifyEmail');
            const verificationLink = `${config.frontend.url}/verify-email?token=${verificationToken}`;

            const html = this.replaceTemplateVariables(template, {
                name,
                verificationLink,
            });

            const { data, error } = await this.resend.emails.send({
                from: this.getFromEmail(),
                to: [to],
                subject: 'Verify Your Email',
                html,
            });

            if (error) {
                console.error('Resend verification email error:', error);
                throw error;
            }

            console.log('Verification email sent successfully:', data?.id);
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }

    static async sendPasswordResetOtp(
        to: string,
        name: string,
        resetOtp: string
    ): Promise<void> {
        try {
            const template = await this.getTemplate('resetPassword');

            const html = this.replaceTemplateVariables(template, {
                name,
                resetOtp,
                year: new Date().getFullYear().toString()
            });

            const { data, error } = await this.resend.emails.send({
                from: this.getFromEmail(),
                to: [to],
                subject: 'Reset Your Password',
                html,
            });

            if (error) {
                console.error('Resend password reset email error:', error);
                throw error;
            }

            console.log('Password reset OTP email sent successfully:', data?.id);
        } catch (error) {
            console.error('Error sending password reset OTP email:', error);
            throw new Error('Failed to send password reset OTP email');
        }
    }

    static async sendInterviewReminderEmail(
        to: string,
        candidateName: string,
        candidatePhone: string,
        jobRole: string,
        jobExperienceLevel: string,
        jobTitle: string,
        companyName: string
    ) {
        try {
            const template = await this.getTemplate('interviewReminder');

            const interviewGuideline = `
        This is an AI-powered interview process.

        - You will join the interview online.
        - Your basic face verification will be performed first.
        - You must allow camera and microphone access.
        - Your interview will be recorded for evaluation.
        - Do NOT cheat or switch tabs during the interview.
        - Answer questions by speaking clearly.
        - Your video and audio will be sent to the server for final evaluation.
        - Once the report is generated, you can view it on your dashboard.
        `;

            const html = this.replaceTemplateVariables(template, {
                candidateName,
                candidatePhone,
                jobRole,
                jobExperienceLevel,
                jobTitle,
                companyName,
                interviewGuideline,
                year: new Date().getFullYear().toString()
            });

            const { data, error } = await this.resend.emails.send({
                from: this.getFromEmail(),
                to: [to],
                subject: `Reminder: Interview for ${jobTitle}`,
                html,
            });

            if (error) {
                console.error('Resend interview reminder email error:', error);
                throw error;
            }

            console.log('Interview reminder email sent successfully:', data?.id);

        } catch (error) {
            console.error("Error sending interview reminder email:", error);
            throw new Error("Failed to send interview reminder email");
        }
    }
}