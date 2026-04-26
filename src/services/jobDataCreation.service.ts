import { z } from "zod";

const JobDescriptionSchema = z.object({
    jobDescription: z.string().min(2).max(2000).describe("Comprehensive overview of the job"),
});


type JobDescription = z.infer<typeof JobDescriptionSchema>;


const InterviewGuidelinesSchema = z.object({
    interviewGuidelines: z.string().min(2).max(2000).describe("Detailed guidelines for the interview")
});

type InterviewGuidelines = z.infer<typeof InterviewGuidelinesSchema>;

const RequirementsSchema = z.object({
    requirements: z.string().min(2).max(2000).describe("Specific technical and soft skill requirements")
});

type Requirements = z.infer<typeof RequirementsSchema>;

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../config/config.js";

export async function generateJobDescription({ jobTitle, jobRole, experienceLevel, workMode, skills }: {
    jobTitle: string;
    jobRole: string;
    experienceLevel: string;
    workMode: string;
    skills: string[];
}): Promise<JobDescription> {
    // Initialize the model (Gemini 1.5 Flash is recommended for stability)
    // 1. Initialize the model with your API Key

    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: config.aiModel.geminiApiKey, // Get this from AI Studio
        temperature: 0.7, // Adjust for creativity
    });

    // Bind the schema to the model
    const structuredLlm = llm.withStructuredOutput(JobDescriptionSchema);

    const prompt = `
  Act as a Technical Recruiter. Create a professional JD for:
  - Title: ${jobTitle}
  - Role: ${jobRole}
  - Experience: ${experienceLevel}
  - Mode: ${workMode}
  - Required Skills: ${skills}

  Provide a concise Role Overview, Responsibilities, and Technical Requirements.
  Ensure the tone matches the ${experienceLevel} seniority level.
`;

    try {
        const result = await structuredLlm.invoke(prompt);
        // console.log(result);
        return result;
    } catch (error) {
        console.error("Failed to generate job data:", error);
        throw new Error("Failed to generate job data. Please do it manually.");
    }
}



/**
 * Generates structured interview guidelines and sample questions.
 */
export async function generateInterviewGuidelines({ jobTitle, jobRole, experienceLevel, skills, workMode }: {
    jobTitle: string;
    experienceLevel: string;
    jobRole: string;
    skills: string[];
    workMode: string;
}): Promise<InterviewGuidelines> {
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash", // Note: gemini-2.5 doesn't exist yet, sticking to stable
        apiKey: config.aiModel.geminiApiKey,
        temperature: 0.6,
    });

    const structuredLlm = llm.withStructuredOutput(InterviewGuidelinesSchema);

    const prompt = `
        Generate a 3-stage interview roadmap for a ${experienceLevel} ${jobTitle}.
        Focus on these skills: ${skills.join(", ")}.
        Include specific technical questions and behavioral benchmarks for this seniority level.
        Tailor the guidelines for a ${workMode} role, emphasizing remote collaboration skills if applicable.
    `;

    try {
        return await structuredLlm.invoke(prompt);
    } catch (error) {
        throw new Error("Interview guidelines generation failed.");
    }
}

/**
 * Generates specific technical and soft skill requirements.
 */
export async function generateRequirements({ jobTitle, experienceLevel, skills }: {
    jobTitle: string;
    experienceLevel: string;
    skills: string[];
}): Promise<Requirements> {
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        apiKey: config.aiModel.geminiApiKey,
        temperature: 0.5,
    });

    const structuredLlm = llm.withStructuredOutput(RequirementsSchema);

    const prompt = `
        List detailed job requirements for a ${experienceLevel} ${jobTitle}.
        Base technical requirements on: ${skills.join(", ")}.
        Include necessary soft skills, certifications, and educational expectations for this level.
    `;

    try {
        return await structuredLlm.invoke(prompt);
    } catch (error) {
        console.error("Failed to generate requirements:", error);
        throw new Error("Requirements generation failed.");
    }
}