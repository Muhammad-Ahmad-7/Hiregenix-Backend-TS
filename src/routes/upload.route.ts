import express, { Request, response, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { config } from "../config/config.js";

const uploadRouter = express.Router();

// multer based file upload route
uploadRouter.post("/file", isLoggedIn, upload.single("file"), asyncHandler(
    async (req: Request, res: Response) => {
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

        return responseHelper(res, 200, "Success", "File uploaded successfully.", {
            data: {
                url: result.secure_url,
            }
        });
    }
));

// Cloudinary signed URL generation route
uploadRouter.post("/generate-signed-url", isLoggedIn, asyncHandler(async (req: Request, res: Response) => {
    console.log("in signed url api");
    const { interviewId, questionId } = req.body;
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `interviews/${interviewId}/${questionId}`;
    const paramsToSign = {
        public_id: publicId,
        timestamp,
        folder: "interviews",
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, config.cloudinary.apiSecret!);
    if (!signature) {
        return responseHelper(res, 500, "Failed", "Failed to generate signature.");
    }

    return responseHelper(res, 200, "Success", "Signature generated successfully.", {
        data: {
            data: {
                cloudName: config.cloudinary.cloudName!,
                apiKey: config.cloudinary.apiKey!,
                signature,
                timestamp,
                publicId,
            }
        }
    });
}));

export default uploadRouter;