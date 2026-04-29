import { z } from "zod";

const JobDescriptionSchema = z.object({
    jobDescription: z.string().min(2).max(2000).describe("Comprehensive overview of the job"),
});


type JobDescription = z.infer<typeof JobDescriptionSchema>;


const InterviewGuidelinesSchema = z.object({
    interviewGuideline: z.string().min(2).max(2000).describe("Detailed guidelines for the interview")
});

type InterviewGuidelines = z.infer<typeof InterviewGuidelinesSchema>;

const RequirementsSchema = z.object({
    requirements: z.array(z.string().min(2).max(1000).describe("Specific technical and soft skill requirements"))
});

type Requirements = z.infer<typeof RequirementsSchema>;

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../config/config.js";
import { ChatGroq } from "@langchain/groq";
import callLLM from "../utils/call-llm.js";

export async function generateJobDescription({ jobTitle, jobRole, experienceLevel, workMode, skills }: {
    jobTitle: string;
    jobRole: string;
    experienceLevel: string;
    workMode: string;
    skills: string[];
}): Promise<JobDescription> {
    // Initialize the model (Gemini 1.5 Flash is recommended for stability)
    // 1. Initialize the model with your API Key

    const llm = callLLM({ name: "grok/gpt-oss-20b" });


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
    const llm = callLLM({ name: "grok/gpt-oss-20b" });

    const structuredLlm = llm.withStructuredOutput(InterviewGuidelinesSchema);

    const prompt = `
        Generate an interview guidelines for a ${experienceLevel} ${jobTitle}.
        Focus on these skills: ${skills.join(", ")}.
        Include specific technical questions and behavioral benchmarks for this seniority level.
        Tailor the guidelines for a ${workMode} role, emphasizing remote collaboration skills if applicable.
        Make sure the guidelines you generate are for the spoken interview and not for the written/implementation/coding interview.
    `;

    try {
        const result = await structuredLlm.invoke(prompt);
        console.log(result);
        return result;
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
    const llm = callLLM({ name: "grok/gpt-oss-20b" });
    const structuredLlm = llm.withStructuredOutput(RequirementsSchema);

    const prompt = `
        List detailed job requirements for a ${experienceLevel} ${jobTitle}.
        Base technical requirements on: ${skills.join(", ")}.
        Include necessary soft skills, certifications, and educational expectations for this level.

        Example:

    Technical Skills:
    - Proficiency in JavaScript, TypeScript, and Node.js.
    - Experience with React and Angular frameworks.
    - Familiarity with cloud platforms like AWS or Azure.
    - Strong understanding of RESTful APIs and microservices architecture.

    Soft Skills:
    - Excellent communication and teamwork abilities.
    - Problem-solving mindset and adaptability.
    - Leadership experience is a plus.

    Educational Requirements:
    - Bachelor's degree in Computer Science or related field (or equivalent experience).

    Experience:
    - 3-5 years of experience in software development, with a focus on full-stack development.

    Output Format:
    {
    requirements: [
        "Proficiency in JavaScript, TypeScript, and Node.js.",
        "Experience with React and Angular frameworks.",
    ]

    }
    `;

    try {
        const result = await structuredLlm.invoke(prompt);
        console.log(result);
        return result;
    } catch (error) {
        console.error("Failed to generate requirements:", error);
        throw new Error("Requirements generation failed.");
    }
}