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
});

export const companyProfileUpdateSchema = z.object({
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
    hiringStatus: z.enum(["actively_hiring", "paused", "not_hiring"]).optional(),
    ntnNumber: z.string().min(2).max(100).optional(),
});

export const jobCreationSchema = z.object({
    title: z.string().min(2).max(100),
    role: z.string().min(2).max(100),
    interviewGuideline: z.string().min(2).max(2000),

    experienceLevel: z.enum(["entry", "mid", "senior"]),

    description: z.string().min(2),

    requiredSkills: z.array(z.string().min(1)),


    workMode: z.enum(["full-time", "part-time", "remote"]),


    location: z.object({
        city: z.string().min(2).max(100),
        country: z.string().min(2).max(100),
    }),

    salaryRange: z.object({
        min: z.number().min(0),
        max: z.number(),
        currency: z.string().min(2).max(10),
    }),

    requirements: z.array(z.string().min(2)),
    deadline: z.coerce.date(),

})

export const jobDeletionSchema = z.object({
    jobId: z.string().min(2).max(100),
})

export const getJobByIdSchema = z.object({
    jobId: z.string().min(2).max(100),
})

export const updateJobSchema = z.object({
    title: z.optional(z.string().min(2).max(100)),
    role: z.optional(z.string().min(2).max(100)),
    interviewGuideline: z.optional(z.string().min(2).max(500)),

    experienceLevel: z.optional(z.enum(["entry", "mid", "senior"])),

    description: z.optional(z.string().min(2).max(2500)),

    requiredSkills: z.optional(z.array(z.string().min(2).max(20))),


    workMode: z.optional(z.enum(["full-time", "part-time", "remote"])),


    location: z.optional(
        z.object({
            city: z.string().min(2).max(100),
            country: z.string().min(2).max(100),
        })
    ),

    salaryRange: z.optional(
        z.object({
            min: z.number(),
            max: z.number(),
            currency: z.string().min(2).max(10),
        })
    ),

    requirements: z.optional(z.array(z.string().min(2).max(500))),

    status: z.optional(z.enum(["open", "closed"])),

    deadline: z.coerce.date()

})

export const generateJobDataSchema = z.object({
    jobTitle: z.string().min(2).max(100),
})


export const generateJobDataUsingAISchema = z.object({
    jobTitle: z.string().min(2).max(100),
    jobRole: z.string().min(2).max(100),
    experienceLevel: z.enum(["entry", "mid", "senior"]),
    workMode: z.enum(["full-time", "part-time", "remote"]),
    skills: z.array(z.string().min(2).max(100)),
    type: z.enum(["requirements", "interviewGuideline", "description"])
});