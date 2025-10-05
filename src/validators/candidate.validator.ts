import { z } from 'zod';


export const candidateProfileCreationSchema = z.object({
    fullName: z.string().min(2).max(100),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(["male", "female", "other"]),
    country: z.string().min(2).max(100),
    city: z.string().min(2).max(100),
    contactNumber: z.string().min(10).max(15),
    profilePictureUrl: z.url().optional(),
    githubUrl: z.url().optional(),
    linkedinUrl: z.url().optional(),
    portfolioUrl: z.url().optional(),
    skills: z.array(z.string().min(2).max(100)),
    bio: z.string().min(2).max(500).optional(),
    tagline: z.string().min(2).max(100).optional(),
});