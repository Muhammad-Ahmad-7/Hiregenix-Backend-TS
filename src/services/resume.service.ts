import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import Resume from "../models/resume.model";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini", // or gpt-3.5-turbo
  temperature: 0,
});

// Pipeline
export async function parseResume(filePath: string) {
  // 1. Load PDF
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  // 2. Clean text
  const text = docs.map((d) => d.pageContent).join("\n");

  // 3. Define prompt for extraction
  const prompt = `
  Extract candidate information from this resume and return in JSON:
  {
    "name": "",
    "email": "",
    "phone": "",
    "skills": [],
    "experience": [{
        "company": "",
         "role": "",
          "years": 0
    }],
    "education": [{
        "degree": "", 
        "institution": "", 
        "year": ""
    }]
  }

  Resume text:
  ${text}
  `;

  // 4. Call LLM
  const response = await llm.invoke(prompt);

  // 5. Parse JSON
  const structured = JSON.parse(response.content);

  // 6. Save to DB
  const savedResume = await Resume.create(structured);

  return savedResume;
}
