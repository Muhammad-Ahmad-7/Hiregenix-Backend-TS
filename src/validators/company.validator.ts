import { z } from 'zod';


export const companyProfileCreationSchema = z.object({
    companyName: z.string().min(2).max(100).optional(),
    logoUrl: z.url().optional(),
    website: z.url().optional(),
    linkedInUrl: z.url().optional(),
    city: z.string().min(2).max(100).optional(),
    country: z.string().min(2).max(100).optional(),
    foundedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
    description: z.string().min(2).max(500).optional(),
    techStack: z.array(z.string().min(2).max(100)).optional(),
    contactEmail: z.email().optional(),
    isVerified: z.boolean().optional(),
    hiringStatus: z.enum(["actively_hiring", "paused", "not_hiring"]),
    ntnNumber: z.string().min(2).max(100).optional(),
})