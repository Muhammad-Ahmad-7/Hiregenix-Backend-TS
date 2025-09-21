import { NextFunction, Request, Response } from "express";
import ResumeModel from "../models/resume.model.js";
import responseHelper from "../utils/responseHelper.js";

export const isResumeAlreadyUploaded = async (req: Request, res: Response, next: NextFunction) => {
    const candidateId = req.user._id;
    const existingResume = await ResumeModel.findOne({ candidateId });
    if (existingResume) {
        return responseHelper(res, 400, "Failed", "Resume already uploaded. First Delete the existing resume to upload a new one.");
    }
    next();
}