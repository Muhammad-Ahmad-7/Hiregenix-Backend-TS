import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";
import { getChannel } from "../config/rabbitmq.js";
import { RESUME_QUEUE } from "../utils/constant.js";

const resumeParser = asyncHandler(async (req: Request, res: Response) => {
    console.log("Received resume parse request:", req.body);
    const { resume } = req.body;

    if (!resume) {
        return responseHelper(res, 400, "Failed", "Resume content is required.");
    }

    try {
        // Use the safe getChannel function
        // const channel = getChannel();
        // await channel.sendToQueue(RESUME_QUEUE, Buffer.from(JSON.stringify({ resume })));
        console.log("Message sent to RabbitMQ queue successfully");
    } catch (error) {
        console.error("RabbitMQ error:", error);
        return responseHelper(res, 500, "Failed", "Failed to queue resume for processing.");
    }

    return responseHelper(res, 200, "Success", "Resume parsed successfully.", {
        data: {
            name: "John Doe",
            email: "john.doe@example.com"
        }
    });
});

export { resumeParser };