import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from './config.js';

// TO connect to Qdrant running locally
export let client: QdrantClient | null = null;

function connectToQdrant() {
    try {
        if (client !== null) {
            return client;
        }
        client = new QdrantClient({
            url: config.qdrant.url,
            apiKey: config.qdrant.apiKey,
        });
        console.log("Connected to Qdrant");
        return client;
    } catch (error) {
        console.error("Failed to connect to Qdrant:", error);
        throw error;
    }
}

function getQdrantClient(): QdrantClient {
    if (!client) {
        throw new Error("Qdrant client not initialized. Make sure connectToQdrant() is called first.");
    }
    return client;
}

export {
    connectToQdrant, getQdrantClient
}