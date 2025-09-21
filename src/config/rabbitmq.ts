import amqb from "amqplib";
import { RESUME_QUEUE } from "../utils/constant.js";

export let channel: amqb.Channel | null = null;

export default async function connectToRabbitMQ() {
    try {
        const connection = await amqb.connect(process.env.RABBITMQ_URL || "amqp://localhost");
        channel = await connection.createChannel();
        await channel.assertQueue(RESUME_QUEUE, { durable: true });
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
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized. Make sure connectToRabbitMQ() is called first.");
    }
    channel.sendToQueue(queue, Buffer.from(taskId), { persistent: true });
    console.log(`Sent task ${taskId} to queue ${queue}`);
}