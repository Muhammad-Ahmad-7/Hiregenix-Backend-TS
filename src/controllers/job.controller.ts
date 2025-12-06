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
        status,
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
        status,
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

    const findActiveJobs = await JobModel.find({ status: "open", companyId, isDeleted: false }).sort({ createdAt: -1 }).limit(limit).skip(skip);

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

    const jobs = await JobModel.find({}).populate("companyId", "companyName").skip(skip).limit(limit).sort({ createdAt: -1 });

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

    const interviews = await InterviewModel.find({ jobId, companyId: userId }).populate("candidateId", "fullName countryName profilePictureUrl").sort({ scheduledDate: -1 }).skip(skip).limit(limit);
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

    if (!savedJobId) {
        return responseHelper(res, 400, "Failed", "Job Id is required.")
    }

    const savedJob = await SavedJobModel.findByIdAndDelete(savedJobId);

    if (!savedJob) {
        return responseHelper(res, 400, "Failed", "Failed to unsave the job.")
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


export { createJob, deleteJob, getAllJobsWithPagination, getRecommendedJobs, getJobById, updateJobById, getCompanyOpenJobs, getCompanyClosedJobs, getAllAppliedJobsOfCandidate, getAllJobs, getInterviewApplicationsForJob, saveJobById, getSavedJobsOfCandidate, unSaveJobById }