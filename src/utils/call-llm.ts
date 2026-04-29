import { ChatGroq } from "@langchain/groq";
import { config } from "../config/config.js";

interface FunctionArgs {
    name: "grok/gpt-oss-20b" | "grok/llama-8b" | "grok/llama-70b" | "grok/gpt-oss-120b";
}
export default function callLLM(args: FunctionArgs) {
    switch (args.name) {
        case "grok/llama-8b":
            return new ChatGroq({
                model: "llama-3.1-8b-instant",
                apiKey: config.aiModel.grokApiKey,
                temperature: 0.7,
            });
        case "grok/llama-70b":
            // Implementation for grok/llama-70b
            return new ChatGroq({
                model: "llama-3.1-70b-instant",
                apiKey: config.aiModel.grokApiKey,
                temperature: 0.7,
            });
        case "grok/gpt-oss-20b":
            // Implementation for grok/gpt-oss-20b
            return new ChatGroq({
                model: "openai/gpt-oss-20b",
                apiKey: config.aiModel.grokApiKey,
                temperature: 0.7,
            });
        case "grok/gpt-oss-120b":
            // Implementation for grok/gpt-oss-120b
            return new ChatGroq({
                model: "openai/gpt-oss-120b",
                apiKey: config.aiModel.grokApiKey,
                temperature: 0.7,
            });
        default:
            throw new Error(`Unknown function name: ${args.name}`);
    }
}