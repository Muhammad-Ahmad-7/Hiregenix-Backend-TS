import express, { Request, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import cloudinary from "../config/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import isLoggedIn from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const uploadRouter = express.Router();


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

export default uploadRouter;