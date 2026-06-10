import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
    email: string,
    token: string
) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: [email],
        subject: "Verify your HireGenix account",
        html: `
        <h2>Verify your email</h2>
        <p>Click below to verify your HireGenix account.</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire soon.</p>
    `,
    });

    if (error) {
        console.error("Resend error:", error);
        throw error;
    }

    return data;
};