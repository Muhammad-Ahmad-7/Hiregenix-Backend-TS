import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { JobModel } from "../models/job.model.js";
import responseHelper from "../utils/responseHelper.js";
import { InterviewModel } from "../models/interview.model.js";

const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
    // Implementation for scheduling interview

    const userId = req.userId;

    const { jobId } = req.params;

    const job = await JobModel.findById(jobId);

    if (!job) {
        return responseHelper(res, 404, "Failed", "Job not found.");
    }

    if (job.deadline && new Date() > new Date(job.deadline)) {
        return responseHelper(res, 400, "Failed", "Cannot schedule interview for a job past its application deadline.");
    }

    const companyId = job.companyId;

    const { scheduledDate } = req.body;

    if (scheduledDate && new Date(scheduledDate) < new Date()) {
        return responseHelper(res, 400, "Failed", "Scheduled time must be in the future.");
    }

    if (scheduledDate && job.deadline && new Date(scheduledDate) > new Date(job.deadline)) {
        return responseHelper(res, 400, "Failed", "Scheduled time must be before the job application deadline.");
    }

    const interview = await InterviewModel.create({
        candidateId: userId,
        jobId: job._id,
        companyId: companyId,
        type: "live",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        status: scheduledDate ? "scheduled" : "pending",
    })


    if (!interview) {
        return responseHelper(res, 500, "Failed", "Failed to schedule interview.");
    }

    return responseHelper(res, 200, "Success", "Interview scheduled successfully.", {
        data: {
            interview
        }
    });
});


const getTodayCandidateInterviews = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const interviews = await InterviewModel.find({ candidateId: userId, scheduledDate: { $gte: start, $lte: end } }).populate("jobId", "title workMode deadline").populate("companyId", "companyName").sort({ scheduledDate: -1 })
    if (!interviews) {
        return responseHelper(res, 500, "Failed", "Failed to fetch interviews.");
    }

    return responseHelper(res, 200, "Success", "Interviews fetched successfully.", {
        data: {
            interviews
        }
    });
});

const getAllCandidateInterviews = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;


    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const interviews = await InterviewModel.find({ candidateId: userId }).populate("jobId", "title workMode deadline").populate("companyId", "companyName").sort({ scheduledDate: -1 }).skip(skip).limit(limit);
    if (!interviews) {
        return responseHelper(res, 500, "Failed", "Failed to fetch interviews.");
    }

    const totalInterviews = await InterviewModel.countDocuments({ candidateId: userId });

    return responseHelper(res, 200, "Success", "Interviews fetched successfully.", {
        data: {
            interviews
        },
    }, {
        total: totalInterviews,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalInterviews / limit),
    });
});

export { scheduleInterview, getTodayCandidateInterviews, getAllCandidateInterviews }