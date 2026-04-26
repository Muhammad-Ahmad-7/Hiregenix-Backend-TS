import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

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
  const collection = collectionName(params.companyId.trim());
  const qdrant = connectToQdrant();

  // Generate embedding - equivalent to get_huggingface_embedding() in Python
  const queryVec = await getHuggingfaceEmbedding(params.query.trim());

  // Search Qdrant - equivalent to qdrant.search() in Python
  let results;
  try {
    results = await qdrant.search(collection, {
      vector: queryVec,
      limit: 5,
      with_payload: true,
    });
  } catch (error) {
    throw new Error(`Knowledge base not found for company: ${params.companyId}`);
  }

  // Build context and sources - same logic as Python loop
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

  // Equivalent to ChatGoogleGenerativeAI in Python (langchain_google_genai)
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: config.aiModel.geminiApiKey,
    temperature: 0.3,
    maxOutputTokens: 512,
  });

  const prompt =
    `You are a helpful assistant answering questions about a company.
You MUST use only the provided context from the company's uploaded PDF.
If the answer is not in the context, say you don't know based on the document.

CONTEXT:
${contextBlock}

QUESTION:
${params.query.trim()}`.trim();

  // Equivalent to llm.invoke(prompt).content in Python
  const response = await llm.invoke([new HumanMessage(prompt)]);
  const answer =
    typeof response.content === "string"
      ? response.content
      : response.content
          .map((c) => (c.type === "text" ? c.text : ""))
          .join("");

  return { answer, sources };
}
