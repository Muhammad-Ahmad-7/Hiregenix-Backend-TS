import { z } from 'zod';


export const signupSchema = z.object({
    username: z.string().min(2).max(50),
    email: z.email(),
    password: z.string().min(8).max(100),
    role: z.enum(['admin', 'candidate', 'company'])
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(8).max(100),
});

export const forgotPasswordSchema = z.object({
    email: z.email(),
});