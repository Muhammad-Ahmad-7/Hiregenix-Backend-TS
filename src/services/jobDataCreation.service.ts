import { z } from "zod";

const JobDataSchema = z.object({
    jobTitle: z.string().describe("The official title of the position"),
    jobRole: z.string().describe("Detailed role or category (e.g., Backend Developer)"),
    experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
    status: z.enum(["Open", "Closed"]),
    workMode: z.enum(["Remote", "On-site", "Hybrid"]),
    applicationDeadline: z.string().describe("ISO formatted date string after today's date"),
    city: z.string().min(2).max(100).describe("City where the job is located"),
    country: z.string().min(2).max(100).describe("Country where the job is located"),
    minSalary: z.number().min(0).describe("Minimum salary for the position"),
    maxSalary: z.number().describe("Maximum salary for the position"),
    currency: z.string().min(3).max(10).describe("Currency for the salary (e.g., USD, PKR)"),
    jobDescription: z.string().min(2).max(5000).describe("Comprehensive overview of the job"),
    interviewGuideline: z.string().min(2).max(2000).describe("Instructions for the interview process"),
    skills: z.array(z.string()).min(1).max(10).describe("List of up to 10 technical skills"),
    requirements: z.array(z.string()).describe("List of specific job requirements").min(2).max(10),
});

type JobData = z.infer<typeof JobDataSchema>;

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export async function generateJobData(title: string): Promise<JobData> {
    // Initialize the model (Gemini 1.5 Flash is recommended for stability)
    // 1. Initialize the model with your API Key

    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: "AIzaSyAZ5Hg95MIotin7ec4cGKq-KCPygSho9jw", // Get this from AI Studio
        temperature: 0.7, // Adjust for creativity
    });

    // Bind the schema to the model
    const structuredLlm = llm.withStructuredOutput(JobDataSchema);

    const prompt = `
    Generate a professional and detailed job posting for the position: "${title}".
    Provide realistic data for all fields including a high-quality job description, 
    specific interview guidelines, and relevant skills/requirements.
    Use current industry standards for salary ranges if not specified.
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

// generateJobData("Backend Developer");