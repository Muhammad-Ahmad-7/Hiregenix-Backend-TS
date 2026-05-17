import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

import callLLM from "../utils/call-llm.js";
import { config } from "../config/config.js";
import { connectToQdrant } from "../config/qdrant.js";
import { getHuggingfaceEmbedding } from "./embeddings.service.js";

interface SourceItem {
  score: number;
  chunkIndex: number | null;
  pdfUrl: string | null;
}

function collectionName(companyId: string): string {
  return `company_kb_${companyId}`;
}
export async function getCompanyRagAnswer(params: {
  companyId: string;
  query: string;
}) {
  console.time("TOTAL");

  const collection = collectionName(params.companyId.trim());
  const qdrant = connectToQdrant();

  // 🔴 EMBEDDING
  console.time("EMBEDDING");
  const queryVec = await getHuggingfaceEmbedding(params.query.trim());
  console.timeEnd("EMBEDDING");

  // 🔴 QDRANT SEARCH
  console.time("QDRANT");
  let results;
  try {
    results = await qdrant.search(collection, {
      vector: queryVec,
      limit: 5,
      with_payload: true,
    });
  } catch (error) {
    console.timeEnd("QDRANT");
    throw new Error(`Knowledge base not found for company: ${params.companyId}`);
  }
  console.timeEnd("QDRANT");

  // 🟡 CONTEXT BUILD
  console.time("CONTEXT_BUILD");
  const contexts: string[] = [];
  const sources: SourceItem[] = [];

  for (const r of results) {
    const payload = (r.payload ?? {}) as Record<string, unknown>;
    const txt = (payload["text"] as string | undefined) ?? "";
    if (txt) {
      contexts.push(txt);
      sources.push({
        score: r.score,
        chunkIndex: (payload["chunkIndex"] as number | null) ?? null,
        pdfUrl: (payload["pdfUrl"] as string | null) ?? null,
      });
    }
  }

  const contextBlock =
    contexts.length > 0 ? contexts.join("\n\n---\n\n") : "";
  console.timeEnd("CONTEXT_BUILD");

  // 🟡 LLM INIT
  console.time("LLM_INIT");
  // const llm = new ChatGoogleGenerativeAI({
  //   model: "gemini-2.5-flash",
  //   apiKey: config.aiModel.geminiApiKey,
  //   temperature: 0.3,
  //   maxOutputTokens: 512,

  // maxRetries:0, 
  // });
  const llm = callLLM({ name: "grok/gpt-oss-20b" });
  console.timeEnd("LLM_INIT");

  // 🟡 PROMPT BUILD
  console.time("PROMPT_BUILD");
  const prompt = `You are a helpful assistant answering questions about a company.
You MUST use only the provided context from the company's uploaded PDF.
If the answer is not in the context, say you don't know based on the document.

CONTEXT:
${contextBlock}

QUESTION:
${params.query.trim()}`.trim();
  console.timeEnd("PROMPT_BUILD");

  // 🔴 LLM CALL (VERY IMPORTANT)
  console.time("LLM_RESPONSE");
  const response = await llm.invoke([new HumanMessage(prompt)]);
  console.timeEnd("LLM_RESPONSE");

  const answer =
    typeof response.content === "string"
      ? response.content
      : response.content
          .map((c) => (c.type === "text" ? c.text : ""))
          .join("");

  console.timeEnd("TOTAL");

  return { answer, sources };
}