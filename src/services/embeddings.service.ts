import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { config } from "../config/config.js";

const HF_TOKEN = process.env.HF_TOKEN ?? "";
const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

/**
 * Equivalent to Python's HuggingFaceEndpointEmbeddings
 * Uses HuggingFace Inference API - no local PyTorch needed
 */
export async function getHuggingfaceEmbedding(text: string): Promise<number[]> {
  const model = new HuggingFaceInferenceEmbeddings({
    model: HF_MODEL,
    apiKey: HF_TOKEN,
  });
  return model.embedQuery(text);
}

/**
 * Equivalent to Python's GoogleGenerativeAIEmbeddings
 * Uses Gemini embedding-001 model
 */
export async function getGeminiEmbedding(text: string): Promise<number[]> {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/embedding-001",
    apiKey: config.aiModel.geminiApiKey,
  });
  return embeddings.embedQuery(text);
}
