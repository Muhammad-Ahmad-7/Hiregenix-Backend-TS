import { NextFunction, Request, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
import { config } from "../config/config.js";
import { de } from "zod/locales";

// Extend Express Request interface to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return responseHelper(res, 401, "Failed", "Unauthorized: No token provided.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return responseHelper(res, 401, "Failed", "Unauthorized: No token provided.");
    }

    const decodeToken = jwt.verify(token, config.jwt.accessTokenSecret) as { _id: string };

    if (!decodeToken || !decodeToken._id) {
        return responseHelper(res, 401, "Failed", "Unauthorized: Invalid token.");
    }

    const user = await User.findById(decodeToken._id).select("-password");
    if (!user) {
        return responseHelper(res, 401, "Failed", "Unauthorized: User not found.");
    }

    req.user = user;
    next();
}

export default isLoggedIn;