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
import { RecommendedJobModel } from "../models/recommended_jobs.model.js";
import CandidateModel from "../models/candidate.model.js";
import { InterviewModel } from "../models/interview.model.js";
import { SavedJobModel } from "../models/save_job.model.js";
import mongoose from "mongoose";
import { generateInterviewGuidelines, generateJobDescription, generateRequirements } from "../services/jobDataCreation.service.js";



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
        deadline
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
        companyId,
        deadline
    })

    if (!newJob) {
        return responseHelper(res, 500, "Failed", "Failed to create job. Please try again later.");
    }

    const job = await JobModel.findById(newJob._id).populate("companyId", "companyName");

    const newTask = await TaskModel.create({
        userId: companyId,
        type: "job_description_embeddings",
        payload: { jobId: newJob._id.toString() },
        status: "pending"
    })

    if (!newTask) {
        console.log("ERROR :: Task not created")
        return;
    }

    sendToQueue(JOB_DESCRIPTION_EMBEDDINGS_QUEUE, newTask._id.toString());

    return responseHelper(res, 200, "Success", "Job created successfully.", {
        data: {
            job
        }
    })
});

const getAllJobsWithPagination = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string ?? "10", 10);
    const lastId = req.query.lastId as string | undefined;

    const userId = req.userId; // adjust if needed

    // Base match conditions
    const matchConditions: any = {
        isDeleted: false,
        status: "open"
    };

    if (lastId) {
        matchConditions._id = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    const jobs = await JobModel.aggregate([
        { $match: matchConditions },

        { $sort: { createdAt: -1 } },

        { $match: { deadline: { $gte: new Date() } } },

        { $limit: limit },

        // Populate company
        {
            $lookup: {
                from: "companies",
                localField: "companyId",
                foreignField: "_id",
                as: "company"
            }
        },
        {
            $unwind: {
                path: "$company",
                preserveNullAndEmptyArrays: true
            }
        },

        // Lookup saved jobs for this user
        {
            $lookup: {
                from: "savedjobs",
                let: {
                    jobId: "$_id",
                    candidateId: new mongoose.Types.ObjectId(userId) // Move ObjectId creation here
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$jobId", "$$jobId"] },
                                    { $eq: ["$candidateId", "$$candidateId"] } // Use the variable from let
                                ]
                            }
                        }
                    }
                ],
                as: "savedRelation"
            }
        },

        // Add isSaved flag
        {
            $addFields: {
                isSaved: { $gt: [{ $size: "$savedRelation" }, 0] }
            }
        },

        // lookup applied jobs for this user
        {
            $lookup: {
                from: "interviews",
                let: {
                    jobId: "$_id",
                    candidateId: new mongoose.Types.ObjectId(userId) // Move ObjectId creation here
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$jobId", "$$jobId"] },
                                    { $eq: ["$candidateId", "$$candidateId"] } // Use the variable from let
                                ]
                            }
                        }
                    }
                ],
                as: "appliedRelation"
            }
        },

        // Add isApplied flag
        {
            $addFields: {
                isApplied: { $gt: [{ $size: "$appliedRelation" }, 0] }
            }
        },

        // Remove unneeded lookup data
        {
            $project: {
                savedRelation: 0
            }
        }
    ]);

    if (!jobs) {
        return responseHelper(res, 500, "Failed", "Failed to fetch jobs.");
    }

    if (jobs.length === 0) {
        return responseHelper(res, 200, "Success", "No jobs found");
    }

    // next cursor
    const nextCursor = jobs[jobs.length - 1]?._id ?? null;

    return responseHelper(
        res,
        200,
        "Success",
        "Jobs fetched successfully.",
        {
            data: { jobs }
        },
        { nextCursor }
    );
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
        deadline,
        title,
        role,
        salaryRange,
        city,
        interviewGuideline,
        experienceLevel,
        description,
        requiredSkills,
        workMode,
        location,
        requirements,
    } = req.body;
    // Check if job exists
    const job = await JobModel.findById(jobId);
    if (!job) {
        return responseHelper(res, 400, "Failed", "Job not found.");
    }

    // Build update object using previous values if not provided
    const updatedFields = {
        deadline: deadline ?? job.deadline,
        title: title ?? job.title,
        role: role ?? job.role,
        salaryRange: {
            min: salaryRange.min ?? job.salaryRange.min,
            max: salaryRange.max ?? job.salaryRange.max,
            currency: job.salaryRange.currency ?? "PKR"
        },
        location: {
            city: location.city ?? job.location.city,
            country: job.location.country
        },
        interviewGuideline: interviewGuideline ?? job.interviewGuideline,
        experienceLevel: experienceLevel ?? job.experienceLevel,
        description: description ?? job.description,
        requiredSkills: requiredSkills ?? job.requiredSkills,
        workMode: workMode ?? job.workMode,
        requirements: requirements ?? job.requirements,
        qdrantId: null,
    };


    if (job.qdrantId !== null) {
        const find = await qdrantClient.retrieve(
            "job",
            {
                ids: [job.qdrantId as string]
            }
        )
        if (!find) {
            console.log("Qdrant document not found for this job. It may have been already deleted or not created properly.")
        } else {
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
        }
    }

    const updatedJob = await JobModel.findByIdAndUpdate(jobId, updatedFields, { new: true });

    if (!updatedJob) {
        console.error("Error updating job:");
        return responseHelper(res, 500, "Failed", "Failed to update job.");
    }

    const newTask = await TaskModel.create({
        userId: companyId,
        type: "job_description_embeddings",
        payload: { jobId: updatedJob._id.toString() },
        status: "pending"
    })

    if (!newTask) {
        console.log("ERROR :: Task not created")
        return;
    }

    sendToQueue(JOB_DESCRIPTION_EMBEDDINGS_QUEUE, newTask._id.toString());

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

    const interviews = await InterviewModel.find({ jobId: job._id });

    if (interviews && interviews.length > 0) {
        return responseHelper(res, 400, "Failed", "Cannot delete job with existing interviews.");
    }

    if (job.isDeleted) {
        return responseHelper(res, 400, "Failed", "Job already deleted.");
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

    let result = null;

    if (updateJob.qdrantId !== null) {
        result = await qdrantClient.delete(
            "job",
            {
                points: [
                    updateJob?.qdrantId as string
                ],
            },
        )

    }

    if (result && result.status !== "completed") {
        console.log("Job deleted from mongodb but not from qdrant db.")
    }

    return responseHelper(res, 200, "Success", "Job deleted successfully from mongodb and qdrant.");

});

const getCompanyOpenJobs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!userId) {
        return responseHelper(res, 400, "Failed", "User not found.");
    }

    const findCompany = await CompanyModel.findById(userId);

    if (!findCompany) {
        console.log("find company")
        return responseHelper(res, 404, "Failed", "Company not found.");
    }

    const companyId = findCompany._id;

    // find active jobs along with interview count for each job

    const findActiveJobs = await JobModel.aggregate([
        { $match: { status: "open", companyId, isDeleted: false } },
        {
            $lookup: {
                from: "interviews",
                localField: "_id",
                foreignField: "jobId",
                as: "interviews"
            }
        },
        {
            $addFields: {
                totalInterviews: { $size: "$interviews" }
            }
        },
        {
            $project: {
                interviews: 0
            }
        }
    ]).sort({ createdAt: -1 }).limit(limit).skip(skip);

    if (!findActiveJobs || findActiveJobs.length === 0) {
        return responseHelper(res, 404, "Failed", "No active jobs found.");
    }

    const totalActiveJobs = await JobModel.countDocuments({ status: "open", companyId, isDeleted: false });
    return responseHelper(res, 200, "Success", "Active jobs fetched successfully.", {
        data: {
            findActiveJobs
        }
    }, {
        total: totalActiveJobs,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalActiveJobs / limit),
    });
});

const getCompanyClosedJobs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!userId) {
        return responseHelper(res, 400, "Failed", "User not found.");
    }

    const findCompany = await CompanyModel.findById(userId);

    if (!findCompany) {
        console.log("find company")
        return responseHelper(res, 404, "Failed", "Company not found.");
    }

    const companyId = findCompany._id;

    const findClosedJobs = await JobModel.find({ status: "closed", companyId, isDeleted: false }).sort({ createdAt: -1 }).limit(limit).skip(skip);

    if (!findClosedJobs || findClosedJobs.length === 0) {
        return responseHelper(res, 404, "Failed", "No closed jobs found.");
    }

    const totalClosedJobs = await JobModel.countDocuments({ status: "closed", companyId, isDeleted: false });
    return responseHelper(res, 200, "Success", "Closed jobs fetched successfully.", {
        data: {
            findClosedJobs
        }
    }, {
        total: totalClosedJobs,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalClosedJobs / limit),
    });
});

const getRecommendedJobs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user._id;

    if (!userId) {
        return responseHelper(res, 400, "Failed", "User not found.");
    }

    const candidate = await CandidateModel.findOne({ userId });

    if (!candidate) {
        return responseHelper(res, 400, "Failed", "Candidate not found.");
    }

    console.log("found candidate", candidate)

    const candidateId = candidate._id.toString();

    console.log("candidateId", candidateId)


    const recommendedJobs = await RecommendedJobModel.findOne({ candidateId: candidateId });

    console.log("recommendedJobs", recommendedJobs)

    if (!recommendedJobs) {
        return responseHelper(res, 400, "Failed", "No recommended jobs found.");
    }


    return responseHelper(res, 200, "Success", "Recommended jobs fetched successfully.", {
        data: {
            recommendedJobs
        }
    });
});

const getAllAppliedJobsOfCandidate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const jobs = await InterviewModel.find({ candidateId: userId }).populate("jobId", "title workMode deadline").populate("companyId", "companyName logoUrl").skip(skip).limit(limit).sort({ createdAt: -1 });


    if (!jobs) {
        return responseHelper(res, 500, "Failed", "Failed to fetch applied jobs.");
    }

    return responseHelper(res, 200, "Success", "Applied jobs fetched successfully.", {
        data: {
            jobs,
        },
    });
})

const getAllJobs = asyncHandler(async (req: Request, res: Response) => {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const userId = req.userId; // adjust if needed

    const jobs = await JobModel.aggregate([
        { $match: {} },

        { $sort: { createdAt: -1 } },

        { $match: { deadline: { $gte: new Date() } } },

        { $skip: skip },

        { $limit: limit },

        // Populate company
        {
            $lookup: {
                from: "companies",
                localField: "companyId",
                foreignField: "_id",
                as: "company"
            }
        },
        {
            $unwind: {
                path: "$company",
                preserveNullAndEmptyArrays: true
            }
        },

        // Lookup saved jobs for this user
        {
            $lookup: {
                from: "savedjobs",
                let: {
                    jobId: "$_id",
                    currentUserId: new mongoose.Types.ObjectId(userId)
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$jobId", "$$jobId"] },
                                    { $eq: ["$candidateId", "$$currentUserId"] }
                                ]
                            }
                        }
                    }
                ],
                as: "savedRelation"
            }
        },

        // Add isSaved flag
        {
            $addFields: {
                isSaved: { $gt: [{ $size: "$savedRelation" }, 0] }
            }
        },

        // Remove unneeded lookup data and reshape company
        {
            $project: {
                savedRelation: 0,
            }
        }
    ]);

    if (!jobs) {
        return responseHelper(res, 500, "Failed", "Failed to fetch applied jobs.");
    }

    const totalJobs = await JobModel.countDocuments({});

    return responseHelper(res, 200, "Success", "Applied jobs fetched successfully.", {
        data: {
            jobs,
        },
    }, {
        total: totalJobs,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalJobs / limit),
    });
})

const getInterviewApplicationsForJob = asyncHandler(async (req: Request, res: Response) => {
    console.log("get interview application for jobs")
    const { jobId } = req.params;
    const userId = req.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!jobId) {
        return responseHelper(res, 400, "Failed", "Job Id is required.");
    }

    if (Array.isArray(jobId)) {
        return responseHelper(res, 400, "Failed", "Job Id must be a string.");
    }
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return responseHelper(res, 400, "Failed", "Invalid Job Id.");
    }
    const interviews = await InterviewModel.aggregate([
        {
            $match: {
                jobId: new mongoose.Types.ObjectId(jobId),
                companyId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "candidates",
                localField: "candidateId",
                foreignField: "_id",
                as: "candidate"
            }
        },
        {
            $unwind: {
                path: "$candidate",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "reports",
                localField: "_id",
                foreignField: "interviewId",
                as: "report"
            }
        },
        {
            $unwind: {
                path: "$report",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                type: 1,
                scheduledDate: 1,
                status: 1,
                report: 1,
                "candidate.fullName": 1,
                "candidate.countryName": 1,
                "candidate.profilePictureUrl": 1
            }
        },
        { $sort: { scheduledDate: -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);

    console.log("Interviews", interviews);


    if (!interviews) {
        return responseHelper(res, 500, "Failed", "Failed to fetch interview applications.");
    }

    const totalInterviews = await InterviewModel.countDocuments({ jobId, companyId: userId });

    return responseHelper(res, 200, "Success", "Interview applications fetched successfully.", {
        data: {
            interviews
        }
    }, {
        total: totalInterviews,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalInterviews / limit),
    });

});

const saveJobById = asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const userId = req.userId;

    if (!jobId) {
        return responseHelper(res, 400, "Failed", "Job Id is required.");
    }

    const job = await JobModel.findById({ _id: jobId });

    if (!job) {
        return responseHelper(res, 404, "Failed", "Job not found with this id.");
    }

    const findExistingSaveJob = await SavedJobModel.findOne({ jobId: job._id, candidateId: userId });

    if (findExistingSaveJob) {
        return responseHelper(res, 400, "Failed", "You have already saved this job.");
    }

    const savedJob = await SavedJobModel.create({
        jobId: job._id,
        candidateId: userId
    })

    if (!savedJob) {
        return responseHelper(res, 500, "Failed", "Failed to save job.");
    }

    return responseHelper(res, 200, "Success", "Job Saved Successfully.", {
        data: {
            savedJob
        }
    });


});

const unSaveJobById = asyncHandler(async (req: Request, res: Response) => {
    const { savedJobId } = req.params;
    const userId = req.userId;

    if (!savedJobId) {
        return responseHelper(res, 400, "Failed", "Job Id is required.")
    }

    const savedJob = await SavedJobModel.findById(savedJobId);


    if (!savedJob) {
        return responseHelper(res, 400, "Failed", "There is no saved job exist with this document _id")
    }

    if (savedJob.candidateId.toString() !== userId) {
        return responseHelper(res, 400, "Failed", "You can not unsave other candidates job.")
    }

    const deleteSaveJob = await SavedJobModel.findByIdAndDelete(savedJob._id);

    if (!deleteSaveJob) {
        return responseHelper(res, 400, "Failed", "Unsave operation failed.")
    }
    return responseHelper(res, 200, "Success", "Job Unsaved Successfully.", {
        data: {
            savedJob
        }
    });
})

const getSavedJobsOfCandidate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const savedJobs = await SavedJobModel.find({ candidateId: userId }).populate("jobId").skip(skip).limit(limit).sort({ createdAt: -1 });

    if (!savedJobs) {
        return responseHelper(res, 400, "Failed", "Failed to get candidate saved jobs.");
    }

    const totalSavedJobs = await SavedJobModel.countDocuments({ candidateId: userId });

    return responseHelper(res, 200, "Success", "Successfully fetched all saved jobs.", {
        data: {
            savedJobs
        }
    }, {
        total: totalSavedJobs,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalSavedJobs / limit),
    });
});

const getAllCompanyJobs = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // const jobs = await JobModel.find({ companyId: companyId, status: "open" }).skip(skip).limit(limit).sort({ createdAt: -1 });

    const jobs = await JobModel.aggregate([
        {
            $match: {
                companyId: new mongoose.Types.ObjectId(companyId),
                status: "open",
                isDeleted: false
            }
        },
        {
            $lookup: {
                from: "interviews",
                localField: "_id",
                foreignField: "jobId",
                as: "interviews"
            }
        },
        {
            $addFields: {
                totalInterviews: { $size: "$interviews" }
            }
        },
        {
            $project: {
                interviews: 0
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);

    if (!jobs) {
        return responseHelper(res, 500, "Failed", "Failed to fetch applied jobs.");
    }

    const totalJobs = await JobModel.countDocuments({ companyId: companyId, status: "open" });

    return responseHelper(res, 200, "Success", "Company all jobs fetched successfully.", {
        data: {
            jobs,
        },
    }, {
        total: totalJobs,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalJobs / limit),
    });
})

const generateJobDataUsingAI = asyncHandler(async (req: Request, res: Response) => {
    const { jobTitle, jobRole, experienceLevel, workMode, skills, type } = req.body;
    let jobData = null;

    if (type === "description") {
        jobData = await generateJobDescription({ jobTitle, jobRole, experienceLevel, workMode, skills });
    }

    if (type === "interviewGuideline") {
        jobData = await generateInterviewGuidelines({ jobTitle, jobRole, experienceLevel, workMode, skills });
    }

    if (type === "requirements") {
        jobData = await generateRequirements({ jobTitle, experienceLevel, skills });
    }

    if (!jobData) {
        return responseHelper(res, 500, "Failed", "Failed to generate job data.");
    }

    return responseHelper(res, 200, "Success", "Job data generated successfully.", {
        data: {
            jobData
        }
    });
});


export {
    createJob,
    deleteJob,
    getAllJobsWithPagination,
    getRecommendedJobs,
    getJobById,
    updateJobById,
    getCompanyOpenJobs,
    getCompanyClosedJobs,
    getAllAppliedJobsOfCandidate,
    getAllJobs,
    getInterviewApplicationsForJob,
    saveJobById,
    getSavedJobsOfCandidate,
    unSaveJobById,
    getAllCompanyJobs,
    generateJobDataUsingAI
}