import amqb from "amqplib";
import { RESUME_QUEUE, SPEECH_TO_TEXT_QUEUE, CANDIDATE_PROFILE_EMBEDDINGS_QUEUE, JOB_DESCRIPTION_EMBEDDINGS_QUEUE } from "../utils/constant.js";

export let channel: amqb.Channel | null = null;

export default async function connectToRabbitMQ() {
    try {
        const connection = await amqb.connect(process.env.RABBITMQ_URL || "amqp://localhost");
        channel = await connection.createChannel();
        await channel.assertQueue(RESUME_QUEUE, { durable: true });
        await channel.assertQueue(SPEECH_TO_TEXT_QUEUE, { durable: true });
        await channel.assertQueue(CANDIDATE_PROFILE_EMBEDDINGS_QUEUE, { durable: true });
        await channel.assertQueue(JOB_DESCRIPTION_EMBEDDINGS_QUEUE, { durable: true });
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