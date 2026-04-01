import amqb from "amqplib";
import { RESUME_QUEUE, SPEECH_TO_TEXT_QUEUE, CANDIDATE_PROFILE_EMBEDDINGS_QUEUE, JOB_DESCRIPTION_EMBEDDINGS_QUEUE, LIVENESS_CHECK_QUEUE } from "../utils/constant.js";

export let channel: amqb.Channel | null = null;

export default async function connectToRabbitMQ() {
    try {
        const connection = await amqb.connect(process.env.RABBITMQ_URL || "amqp://localhost");
        channel = await connection.createChannel();
        const mainArgs = {
            "x-dead-letter-exchange": "worker_failure_exchange",
            "x-dead-letter-routing-key": "stt.failure"
        }

        const mainArgsForCandidateProfileEmbeddingsQueue = {
            "x-dead-letter-exchange": "worker_failure_exchange",
            "x-dead-letter-routing-key": "candidate_profile_embeddings.failure"
        }

        const mainArgsForJobDescriptionEmbeddingsQueue = {
            "x-dead-letter-exchange": "worker_failure_exchange",
            "x-dead-letter-routing-key": "job_description_embeddings.failure"
        }

        const mainArgsForResumeQueue = {
            "x-dead-letter-exchange": "worker_failure_exchange",
            "x-dead-letter-routing-key": "resume_analysis.failure"
        }
        await channel.assertQueue(RESUME_QUEUE, { durable: true, arguments: mainArgsForResumeQueue });
        await channel.assertQueue(SPEECH_TO_TEXT_QUEUE, { durable: true, arguments: mainArgs });
        await channel.assertQueue(CANDIDATE_PROFILE_EMBEDDINGS_QUEUE, { durable: true, arguments: mainArgsForCandidateProfileEmbeddingsQueue });
        await channel.assertQueue(JOB_DESCRIPTION_EMBEDDINGS_QUEUE, { durable: true, arguments: mainArgsForJobDescriptionEmbeddingsQueue });
        await channel.assertQueue(LIVENESS_CHECK_QUEUE, { durable: true });
        console.log("Connected to RabbitMQ");
        return channel;
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        throw error;
    }
}

// Helper function to get channel safely
export function getChannel(): amqb.Channel {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized. Make sure connectToRabbitMQ() is called first.");
    }
    return channel;
}

export function sendToQueue(queue: string, taskId: string) {
    try {
        if (!channel) {
            throw new Error("RabbitMQ channel not initialized. Make sure connectToRabbitMQ() is called first.");
        }
        channel.sendToQueue(queue, Buffer.from(taskId), { persistent: true });
        console.log(`Sent task ${taskId} to queue ${queue}`);
        console.log("Message sent to RabbitMQ queue successfully");
    } catch (error) {
        console.error("Error sending task to queue:", error);
        return error;
    }
}