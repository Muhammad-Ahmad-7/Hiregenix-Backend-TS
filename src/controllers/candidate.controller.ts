import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";
import { getChannel, sendToQueue } from "../config/rabbitmq.js";
import { RESUME_QUEUE } from "../utils/constant.js";
import cloudinary from "../config/cloudinary.js";

import fs from "fs";
import { TaskModel } from "../models/task.model.js";


const completeCandidateProfile = asyncHandler(async (req: Request, res: Response) => {

});

const resumeParser = asyncHandler(async (req: Request, res: Response) => {
    console.log("Received resume parse request:", req.body);
    const file = req.file;
    if (!file) {
        return responseHelper(res, 400, "Failed", "No file uploaded.");
    }
    // upload to cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "auto", // handles images, pdfs, docx, audio, video
    });

    // delete local file
    fs.unlinkSync(file.path);


    console.log("File uploaded to Cloudinary:", result);

    const resumeUrl = result.secure_url;

    const task = await TaskModel.create({

        userId: req.user._id,
        type: "resume_parsing",
        payload: { resume: resumeUrl },
        status: "pending",
    });



    try {
        // Use the safe getChannel function
        sendToQueue(RESUME_QUEUE, (task._id as string).toString());
        console.log("Message sent to RabbitMQ queue successfully");
    } catch (error) {
        console.error("RabbitMQ error:", error);
        return responseHelper(res, 500, "Failed", "Failed to queue resume for processing.");
    }

    return responseHelper(res, 200, "Success", "Resume uploaded and queued for processing.", {
        data: {
            taskId: task._id
        }
    });
});

export { resumeParser, completeCandidateProfile };