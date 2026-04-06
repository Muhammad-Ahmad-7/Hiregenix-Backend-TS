import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { config } from "../config/config.js";

// ─────────────────────────────────────────────
// Initialise Gemini client once (singleton)
// ─────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(config.aiModel.geminiApiKey!);

const model: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ─────────────────────────────────────────────
// Build a grounded system prompt from company data
// ─────────────────────────────────────────────

function buildSystemPrompt(company: any): string {
  return `
You are a helpful AI assistant embedded on the company profile page of "${company.companyName}".
Answer questions about this company clearly, accurately, and concisely.
Only answer based on the company information provided below.
If the question is unrelated to the company, politely say you can only answer questions about ${company.companyName}.
Keep answers short (2–4 sentences) unless more detail is clearly needed.

--- COMPANY INFORMATION ---
Name:          ${company.companyName}
Location:      ${company.city}, ${company.country}
Founded:       ${company.foundedYear}
NTN Number:    ${company.ntnNumber}
Verified:      ${company.isVerified ? "Yes" : "No"}
Hiring Status: ${company.hiringStatus}
Tech Stack:    ${company.techStack.join(", ")}
Contact Email: ${company.contactEmail}
Website:       ${company.website}
LinkedIn:      ${company.linkedInUrl}
Description:   ${company.description}
---------------------------
  `.trim();
}

// ─────────────────────────────────────────────
// Main service function — called by the controller
// ─────────────────────────────────────────────

export async function getCompanyChatAnswer(
  query: string,
  company: any,
): Promise<string> {
  console.log("first", company);
  const systemPrompt = buildSystemPrompt(company);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\nUser Question: ${query}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 512,
    },
  });

  const answer =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!answer) {
    throw new Error("Gemini returned an empty response.");
  }

  return answer;
}
