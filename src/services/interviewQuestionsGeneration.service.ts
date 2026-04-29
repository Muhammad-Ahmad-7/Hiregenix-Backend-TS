import z from "zod";
import ResumeModel from "../models/resume.model.js";
import { ChatGroq } from "@langchain/groq";
import { config } from "../config/config.js";
import connectDB from "../config/db.js";
import callLLM from "../utils/call-llm.js";

async function generateQuestionsForInterview({ title, role, experienceLevel, interviewGuideline, requiredSkills, requirements, resumeId }: {
    title: string;
    role: string;
    experienceLevel: string;
    interviewGuideline: string;
    requiredSkills: string[];
    requirements: string[];
    resumeId: string;
}): Promise<{ questions: string[]; length: number }> {
    try {
        // Get the job details (interview guidelines, required skills and requirements)

        // Get the candidate's profile related resume (projects, experience, summary etc) from the database

        // await connectDB(); // Ensure DB connection is established

        const resumeData = await ResumeModel.findById(resumeId);

        if (!resumeData) {
            throw new Error("Resume not found.");
        }

        const { projects, experience, summary } = resumeData.parsedData;

        // Build the prompt using the above information

        // console.log("----------------")
        // console.log(`Role ${role}`)
        // console.log(`Experience Level ${experienceLevel}`)
        // console.log(`Interview Guideline ${interviewGuideline}`)
        // console.log(`Required Skills ${requiredSkills.join(", ")}`)
        // console.log(`Requirements ${requirements.join(", ")}`)
        // console.log(`Projects ${projects ? JSON.stringify(projects) : "No projects listed"}`)
        // console.log(`Experience ${experience ? JSON.stringify(experience) : "No experience listed"}`)
        // console.log(`Summary ${summary ? summary : "No summary provided"}`)
        // console.log("----------------")

        const prompt = QUESTIONS_GENERATION_PROMPT_TEMPLATE.replace("{jobTitle}", title)
            .replace("{jobRole}", role)
            .replace("{experienceLevel}", experienceLevel)
            .replace("{interviewGuideline}", interviewGuideline)
            .replace("{requiredSkills}", requiredSkills.join(", "))
            .replace("{requirements}", requirements.join(", "))
            .replace("{projects}", projects ? JSON.stringify(projects) : "No projects listed")
            .replace("{experience}", experience ? JSON.stringify(experience) : "No experience listed")
            .replace("{summary}", summary ? summary : "No summary provided");

        console.log("Generated Prompt for Questions:\n", prompt);

        // Call the LLM to generate the interview questions

        const llm = callLLM({ name: "grok/gpt-oss-20b" });

        const model = llm.withStructuredOutput(questionSchema);

        const result = await model.invoke(prompt);

        console.log("Raw LLM Output for Questions:\n", result);

        // Return the generated questions
        return { questions: result.questions, length: result.questions.length };
    } catch (error) {
        console.error("Failed to generate interview questions:", error);
        throw new Error("Failed to generate interview questions. Please do it manually.");
    }
}
export default generateQuestionsForInterview;


const questionSchema = z.object({
    questions: z.array(z.string().min(5).max(1000).describe("The interview question text")),
});


const QUESTIONS_GENERATION_PROMPT_TEMPLATE = `
    You are a senior technical recruiter conducting a live, one-to-one interview.

    Your task is to generate concise, natural, verbally askable interview questions.

    -------------------------
    OBJECTIVE
    -------------------------
    Generate exactly 10 interview questions that assess:
    - Technical understanding
    - Real-world thinking
    - Authentic past experience
    - Role fit

    -------------------------
    RULES (STRICT)
    -------------------------
    1. Each question:
    - Maximum 20 words
    - Only one idea
    - Focused on a single topic or skill
    - Easy to speak in one breath
    - Natural conversational tone

    2. First question:
    - Must be about candidate's background
    - Based on their projects or resume summary

    3. Remaining 9 questions:
    - Based on role, skills, and requirements
    - Focus on practical and technical understanding

    4. Avoid:
    - Multi-part questions
    - Long or complex phrasing
    - System design questions
    - Generic or vague wording
    - Academic/theoretical tone

    5. Tone:
    - Direct
    - Conversational
    - Spoken interview style

    -------------------------
    OUTPUT FORMAT
    -------------------------
    Return ONLY valid JSON.
    Do not include explanations, notes, or markdown.

    The response must strictly follow this structure:

    {
    "questions": [
        "Question 1",
        "Question 2",
        "Question 3",
        "Question 4",
        "Question 5",
        "Question 6",
        "Question 7",
        "Question 8",
        "Question 9",
        "Question 10"
    ]
    }

    If you are unsure, still return valid JSON in this exact format.

    -------------------------
    INPUT DATA
    -------------------------
    jobTitle: {jobTitle}
    jobRole: {jobRole}
    experienceLevel: {experienceLevel}
    Interview Guidelines: {interviewGuideline}
    Required Skills: {requiredSkills}
    Job Requirements: {requirements}
    Candidate Projects: {projects}
    Candidate Experience: {experience}
    Candidate Resume Summary: {summary}
`;

// generateQuestionsForInterview({
//     title: "Senior Software Engineer",
//     role: "Backend Development",
//     experienceLevel: "Senior",
//     interviewGuideline: "Assess knowledge of Node.js, REST APIs, databases, and server-side logic.",
//     requiredSkills: ["Node.js", "Microservices", "GCP", "Event Sourcing", "CQRS", "GraphQL", "GRPC"],
//     requirements: ["5+ years of backend development experience", "Experience with cloud infrastructure"],
//     resumeId: "69eccb6e3cdc9137e326d053",
// }).then(questions => {
//     // console.log("Generated Questions:", questions);
// }).catch(error => {
//     console.error("Error generating questions:", error);
// });


// question: [
//     'What decisions led to using Node.js in ToolBestAI?',
//     'How did you implement REST APIs in OnyxRenders?',
//     'Why did you choose MongoDB for Virtual Home Staging?',
//     'What are the benefits of using microservices architecture?',
//     'How do you handle database transactions in a concurrent environment?',
//     'Can you explain the concept of Event Sourcing?',
//     'Describe a situation where you had to troubleshoot a complex backend issue.',
//     'Tell me about a time when you had to make a technical decision with limited information.',
//     'What are the key characteristics of a well-designed server-side logic?',
//     'How do you ensure scalability in a cloud-based backend system?',
//     'Can you walk me through your process for implementing CQRS?',
//     'Describe your experience with GraphQL and GRPC.',
//     'Tell me about a project where you had to integrate with a third-party API.'
// ]