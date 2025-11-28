import { Request, response, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ICompanyProfile } from "../types/company.types.js";
import CompanyModel from "../models/company.model.js";
import responseHelper from "../utils/responseHelper.js";
import { JobModel } from "../models/job.model.js";
import { TaskModel } from "../models/task.model.js";
import { sendToQueue } from "../config/rabbitmq.js";
import { JOB_DESCRIPTION_EMBEDDINGS_QUEUE } from "../utils/constant.js";
import { qdrantClient } from "../server.js";

const completeCompanyProfile = asyncHandler(async (req: Request, res: Response) => {
    // take out all the input data from the req.body
    // find the matching document in the CompanyModel using the user._id
    // then update this document with the user provided information

    const companyId = req.user._id;

    const existingCompany = await CompanyModel.findOne({ userId: companyId });

    if (!existingCompany) {
        return responseHelper(res, 400, "Failed", "First Signup then create profile.");
    }

    const { companyName, city, contactEmail, country, description, foundedYear, linkedInUrl, logoUrl, ntnNumber, techStack, website }: ICompanyProfile = req.body;

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
        existingCompany._id,
        {
            companyName,
            city,
            contactEmail,
            country,
            description,
            foundedYear,
            linkedInUrl,
            logoUrl,
            ntnNumber,
            techStack,
            website,
        },
        { new: true }
    );


    if (!updatedCompany) {
        return responseHelper(res, 500, "Failed", "Failed to update company profile. Please try again later.");
    }

    const company = await CompanyModel.findById(updatedCompany._id).populate("userId", "email role");

    return responseHelper(res, 200, "Success", "Company profile created successfully.", {
        data: {
            company
        }
    });
})

const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user._id;
    if (!userId) {
        return responseHelper(res, 400, "Failed", "User not found.");
    }

    const findCompany = await CompanyModel.findOne({ userId });

    if (!findCompany) {
        return responseHelper(res, 404, "Failed", "Company not found.");
    }

    const companyId = findCompany._id;

    const postedJobsCount = await JobModel.countDocuments({ companyId, isDeleted: false });
    const activeJobsCount = await JobModel.countDocuments({ companyId, status: "open", isDeleted: false });

    return responseHelper(res, 200, "Success", "Company stats fetched successfully.", {
        data: {
            postedJobsCount,
            activeJobsCount
        }
    });

});



export { completeCompanyProfile, getDashboardStats }