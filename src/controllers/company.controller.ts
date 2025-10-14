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

    const existingCompany = await CompanyModel.findOne({ userId: req.user._id });

    if (!existingCompany) {
        return responseHelper(res, 400, "Failed", "Company profile not found.")
    }

    const companyId = existingCompany._id;

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
});

const getAllJobsWithPagination = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(typeof req.query.limit === "string" ? req.query.limit : "10", 10);
    const lastId = req.query.lastId;

    const query = lastId ? { _id: { $lt: lastId } } : {};

    const jobs = await JobModel.find({
        ...query,
        isDeleted: false
    })
        .sort({ _id: -1 })
        .limit(limit)
        .populate("companyId", "companyName logoUrl website");

    if (!jobs || jobs.length === 0) {
        return responseHelper(res, 500, "Failed", "Failed to fetch jobs.");
    }

    const nextCursor = jobs.length && jobs[jobs.length - 1] ? jobs[jobs.length - 1]!._id : null

    return responseHelper(res, 200, "Success", "Jobs fetched successfully.", {
        data: {
            jobs,
        },
    }, {
        nextCursor
    });
});

const getJobById = asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.body;

    const job = await JobModel.findById(jobId).populate("companyId", "companyName logoUrl website");


    if (!job) {
        return responseHelper(res, 400, "Failed", "Job not found.");
    }

    if (job.isDeleted) {
        return responseHelper(res, 400, "Failed", "Job is deleted.");
    }

    return responseHelper(res, 200, "Success", "Job fetched successfully.", {
        data: {
            job
        }
    });

});

const updateJobById = asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const existingCompany = await CompanyModel.findOne({ userId: req.user._id });

    if (!existingCompany) {
        return responseHelper(res, 400, "Failed", "Company profile not found.")
    }

    const companyId = existingCompany._id;

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
        status,
    } = req.body;

    // Check if job exists
    const job = await JobModel.findById(jobId);
    if (!job) {
        return responseHelper(res, 400, "Failed", "Job not found.");
    }

    // Build update object using previous values if not provided
    const updatedFields = {
        title: title ?? job.title,
        role: role ?? job.role,
        interviewGuideline: interviewGuideline ?? job.interviewGuideline,
        experienceLevel: experienceLevel ?? job.experienceLevel,
        description: description ?? job.description,
        requiredSkills: requiredSkills ?? job.requiredSkills,
        workMode: workMode ?? job.workMode,
        location: location ?? job.location,
        salaryRange: salaryRange ?? job.salaryRange,
        requirements: requirements ?? job.requirements,
        status: status ?? job.status,
        qdrantId: null,
    };


    const result = await qdrantClient.delete(
        "job",
        {
            points: [
                job?.qdrantId as string
            ],
            wait: true,
        },
    )

    if (result.status !== "completed") {
        console.log("Job deleted from mongodb but not from qdrant db.")
    }


    const updatedJob = await JobModel.findByIdAndUpdate(jobId, updatedFields, { new: true });

    if (!updatedJob) {
        return responseHelper(res, 500, "Failed", "Failed to update job.");
    }

    const newTask = await TaskModel.create({
        userId: companyId,
        type: "job_description_embeddings",
        payload: { jobId: (updatedJob._id as string).toString() },
        status: "pending"
    })

    if (!newTask) {
        console.log("ERROR :: Task not created")
        return;
    }

    sendToQueue(JOB_DESCRIPTION_EMBEDDINGS_QUEUE, (newTask._id as string).toString());

    return responseHelper(res, 200, "Success", "Job updated successfully and queued for processing.", {
        data: {
            updatedJob
        }
    });
});

const deleteJob = asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.body;

    const job = await JobModel.findById(jobId);

    if (!job) {
        return responseHelper(res, 400, "Failed", "Job not found.");
    }

    const updateJob = await JobModel.findByIdAndUpdate(
        job._id,
        {
            isDeleted: true
        },
        { new: true }
    )

    if (!updateJob || updateJob.isDeleted === false) {
        return responseHelper(res, 500, "Failed", "Failed to delete job.");
    }



    const result = await qdrantClient.delete(
        "job",
        {
            points: [
                updateJob?.qdrantId as string
            ],
            wait: true,
        },
    )

    if (result.status !== "completed") {
        console.log("Job deleted from mongodb but not from qdrant db.")
    }

    return responseHelper(res, 200, "Success", "Job deleted successfully from mongodb and qdrant.");

});


export { completeCompanyProfile, createJob, deleteJob, getAllJobsWithPagination, getJobById, updateJobById }