import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import CompanyModel from "../models/company.model.js";
import cookieParser from "cookie-parser";
import responseHelper from "../utils/responseHelper.js";
import { User } from "../models/user.model.js";

export const isCompany = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const companyId = req.user._id;

    const company = await User.findById(companyId);

    if (!company) {
        return responseHelper(res, 404, "Failed", "Company not found.");
    }

    if (company.role !== "company") {
        return responseHelper(res, 403, "Failed", "You are not authorized to access this resource.");
    }

    next();
})