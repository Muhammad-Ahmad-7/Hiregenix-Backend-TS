import { Request, response, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ICompanyProfile } from "../types/company.types.js";
import CompanyModel from "../models/company.model.js";
import responseHelper from "../utils/responseHelper.js";
import { JobModel } from "../models/job.model.js";
import { TaskModel } from "../models/task.model.js";
import { sendToQueue } from "../config/rabbitmq.js";
import { JOB_DESCRIPTION_EMBEDDINGS_QUEUE } from "../utils/constant.js";

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


const createJob = asyncHandler(async (req: Request, res: Response) => {
    // take out all the job information
    // create a job collection in the mongodb 
    // create a new rabbitmq task and give a response to the frontend
    const {
        title,
        role,
        interviewGuideline,
        experienceLevel,
        description,
        requiredSkills,
        workMode,
        location,
        salaryRange,
        requirements,
        status
    } = req.body;

    const companyId = req.user._id;


    const newJob = await JobModel.create({
        title,
        role,
        interviewGuideline,
        experienceLevel,
        description,
        requiredSkills,
        workMode,
        location,
        salaryRange,
        requirements,
        status,
        companyId
    })

    if (!newJob) {
        return responseHelper(res, 500, "Failed", "Failed to create job. Please try again later.");
    }

    const job = await JobModel.findById(newJob._id).populate("companyId", "companyName");

    const newTask = await TaskModel.create({
        userId: companyId,
        type: "job_description_embeddings",
        payload: { jobId: (newJob._id as string).toString() },
        status: "pending"
    })

    if (!newTask) {
        console.log("ERROR :: Task not created")
        return;
    }

    sendToQueue(JOB_DESCRIPTION_EMBEDDINGS_QUEUE, (newTask._id as string).toString());

    return responseHelper(res, 200, "Success", "Job created successfully.", {
        data: {
            job
        }
    })
})


export { completeCompanyProfile, createJob }