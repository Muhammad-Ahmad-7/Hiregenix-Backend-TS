import { NextFunction, Request, Response } from "express";
import ResumeModel from "../models/resume.model.js";
import responseHelper from "../utils/responseHelper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const isResumeAlreadyUploaded = async (req: Request, res: Response, next: NextFunction) => {
    const candidateId = req.user._id;
    const existingResume = await ResumeModel.findOne({ candidateId });
    if (existingResume) {
        return responseHelper(res, 400, "Failed", "Resume already uploaded. First Delete the existing resume to upload a new one.");
    }
    next();
}


export const isCandidate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const candidateId = req.user._id;

    const candidate = await User.findById(candidateId);

    if (!candidate) {
        return responseHelper(res, 404, "Failed", "Candidate not found.");
    }

    if (candidate.role !== "candidate") {
        return responseHelper(res, 403, "Failed", "You are not authorized to access this resource. This resource is only for candidates.");
    }

    next();
})