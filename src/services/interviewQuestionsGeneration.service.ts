import z from "zod";
import ResumeModel from "../models/resume.model.js";
import { ChatGroq } from "@langchain/groq";
import { config } from "../config/config.js";

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

        const llm = new ChatGroq({
            model: "llama-3.3-70b-versatile",
            apiKey: config.aiModel.grokApiKey,
            temperature: 0.7,
        });

        const model = llm.withStructuredOutput(questionSchema);

        const result = await model.invoke(prompt);

        console.log("Raw LLM Output for Questions:\n", result);

        // Return the generated questions
        return { questions: result.question, length: result.question.length };
    } catch (error) {
        console.error("Failed to generate interview questions:", error);
        throw new Error("Failed to generate interview questions. Please do it manually.");
    }
}
export default generateQuestionsForInterview;


const questionSchema = z.object({
    question: z.array(z.string().min(5).max(1000).describe("The interview question text")),
});


const QUESTIONS_GENERATION_PROMPT_TEMPLATE = `
    You are a senior technical recruiter conducting a LIVE, ONE-TO-ONE ORAL interview.

    Your task is to generate SHORT, CLEAR, and VERBALLY ASKABLE interview questions.

    -------------------------
    OBJECTIVE
    -------------------------
    Generate 10-15 interview questions that evaluate:
    - Technical understanding
    - Real-world thinking
    - Past experience authenticity
    - Role fit

    -------------------------
    STRICT RULES (CRITICAL)
    -------------------------
    1. Each question MUST:
    - Be MAX 20 words
    - Contain ONLY ONE idea (no multi-part questions)
    - Be easy to say out loud in one breath
    - Sound natural in a conversation

    2. FIRST 3 questions:
    - Based on candidate's projects/experience
    - Mention specific tech (if available)
    - Focus on "why", "how", or "decision-making"

    3. Remaining questions:
    - Based on job role, skills, and requirements
    - Mix of:
        - Technical (theoretical, definition, concepts)
        - Situational (real-world scenarios)
        - Behavioral (decisions, ownership)

    4. STRICTLY AVOID:
    - Long or complex sentences
    - Multiple questions in one line
    - System design prompts like "design architecture"
    - Generic questions
    - Theoretical or academic phrasing

    5. Tone:
    - Direct
    - Conversational
    - Interviewer speaking live
    - Follow the interview guidelines strictly

    -------------------------
    OUTPUT FORMAT (STRICT JSON)
    -------------------------
    Return ONLY valid JSON:

    {
    "questions": ["Question 1", "Question 2", ..., "Question N"]
    }

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


