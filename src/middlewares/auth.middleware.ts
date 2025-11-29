import { NextFunction, Request, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
import { config } from "../config/config.js";
import { de } from "zod/locales";
import { CompanyModel } from "../models/company.model.js";
import CandidateModel from "../models/candidate.model.js";

// Extend Express Request interface to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: any;
            userId?: string;
        }
    }
}

interface DecodeToken { _id: string, userId: string, role: string, email: string }

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return responseHelper(res, 401, "Failed", "Unauthorized: No token provided.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return responseHelper(res, 401, "Failed", "Unauthorized: No token provided.");
    }

    const decodeToken = jwt.verify(token, config.jwt.accessTokenSecret) as DecodeToken;

    if (!decodeToken || !decodeToken._id) {
        return responseHelper(res, 401, "Failed", "Unauthorized: Invalid token.");
    }

    const user = await User.findById(decodeToken._id).select("-password");
    if (!user) {
        return responseHelper(res, 401, "Failed", "Unauthorized: User not found.");
    }

    if (user.role === "company") {
        const company = await CompanyModel.findById({ _id: decodeToken.userId });
        if (!company) {
            return responseHelper(res, 401, "Failed", "Unauthorized: Company profile not found.");
        }
    }

    if (user.role === "candidate") {
        const candidate = await CandidateModel.findById({ _id: decodeToken.userId });
        if (!candidate) {
            return responseHelper(res, 401, "Failed", "Unauthorized: Candidate profile not found.");
        }
    }

    console.log("DECODED TOKEN", decodeToken);

    req.user = user;
    req.userId = decodeToken.userId.toString();
    next();
}

export default isLoggedIn;