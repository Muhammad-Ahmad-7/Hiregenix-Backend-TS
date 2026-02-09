import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { JobModel } from "../models/job.model.js";
import responseHelper from "../utils/responseHelper.js";
import { InterviewModel } from "../models/interview.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import QuestionResultModel from "../models/question-result.model.js";
import { isValidObjectId } from "mongoose";
import { TaskModel } from "../models/task.model.js";
import { SPEECH_TO_TEXT_QUEUE } from "../utils/constant.js";
import { sendToQueue } from "../config/rabbitmq.js";

const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for scheduling interview

  const userId = req.userId;

  const { jobId } = req.params;

  const job = await JobModel.findById(jobId);

  if (!job) {
    return responseHelper(res, 404, "Failed", "Job not found.");
  }

  if (job.deadline && new Date() > new Date(job.deadline)) {
    return responseHelper(
      res,
      400,
      "Failed",
      "Cannot schedule interview for a job past its application deadline."
    );
  }

  const companyId = job.companyId;

  const { scheduledDate } = req.body;

  //   if (scheduledDate && new Date(scheduledDate) < new Date()) {
  //     return responseHelper(
  //       res,
  //       400,
  //       "Failed",
  //       "Scheduled time must be in the future."
  //     );
  //   }
  const scheduled = new Date(scheduledDate);
  const today = new Date();

  // Zero out the time part for both dates
  scheduled.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (scheduled < today) {
    return responseHelper(
      res,
      400,
      "Failed",
      "Scheduled time must be today or in the future."
    );
  }

  if (
    scheduledDate &&
    job.deadline &&
    new Date(scheduledDate) > new Date(job.deadline)
  ) {
    return responseHelper(
      res,
      400,
      "Failed",
      "Scheduled time must be before the job application deadline."
    );
  }

  const interview = await InterviewModel.create({
    candidateId: userId,
    jobId: job._id,
    companyId: companyId,
    type: "live",
    scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
    status: scheduledDate ? "scheduled" : "pending",
  });

  if (!interview) {
    return responseHelper(res, 500, "Failed", "Failed to schedule interview.");
  }

  return responseHelper(
    res,
    200,
    "Success",
    "Interview scheduled successfully.",
    {
      data: {
        interview,
      },
    }
  );
});

// const rescheduleInterview = asyncHandler()

const getTodayCandidateInterviews = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const interviews = await InterviewModel.find({
      candidateId: userId,
      scheduledDate: { $gte: start, $lte: end },
    })
      .populate("jobId")
      .populate("companyId")
      .sort({ scheduledDate: -1 });
    if (!interviews) {
      return responseHelper(res, 500, "Failed", "Failed to fetch interviews.");
    }

    return responseHelper(
      res,
      200,
      "Success",
      "Interviews fetched successfully.",
      {
        data: {
          interviews,
        },
      }
    );
  }
);

const getAllCandidateInterviews = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const interviews = await InterviewModel.find({ candidateId: userId })
      .populate("jobId", "title workMode deadline")
      .populate("companyId", "companyName")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit);
    if (!interviews) {
      return responseHelper(res, 500, "Failed", "Failed to fetch interviews.");
    }

    const totalInterviews = await InterviewModel.countDocuments({
      candidateId: userId,
    });

    return responseHelper(
      res,
      200,
      "Success",
      "Interviews fetched successfully.",
      {
        data: {
          interviews,
        },
      },
      {
        total: totalInterviews,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalInterviews / limit),
      }
    );
  }
);

const getCandidateInterviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { interviewId } = req.params;

    const interview = await InterviewModel.findById(interviewId).populate(
      "jobId",
      "title role workMode deadline"
    ).populate(
      "companyId",
      "companyName logoUrl"
    );
    if (!interview) {
      return responseHelper(res, 404, "Failed", "Interview not found.");
    }
    if (interview.candidateId.toString() !== userId) {
      return responseHelper(res, 403, "Failed", "Unauthorized access.");
    }

    return responseHelper(
      res,
      200,
      "Success",
      "Interview fetched successfully.",
      {
        data: {
          interview,
        },
      }
    );
  }
);

const createInterviewQuestionResult = asyncHandler(async (req: Request, res: Response) => {
  const { interviewId, questionId, questionText, videoUrl, numberOfTabSwitch } = req.body;

  if (!interviewId || !questionId || !questionText) {
    console.log("missing")
    return responseHelper(res, 400, "Failed", "Missing required fields.");
  }

  if (!isValidObjectId(interviewId)) {
    return responseHelper(res, 400, "Failed", "Invalid interview ID.");
  }

  const interview = await InterviewModel.findById(interviewId);
  const userId = req.userId;
  if (!interview) {
    return responseHelper(res, 404, "Failed", "Interview not found.");
  }
  const questionResultExists = await QuestionResultModel.findOne({
    interviewId,
    questionId,
  });

  if (questionResultExists) {
    return responseHelper(res, 400, "Failed", "Question result already exists.");
  }

  // db call to create a new question result document
  const questionResult = await QuestionResultModel.create({
    interviewId,
    questionId,
    questionText,
    videoUrl,
    numberOfTabSwitch,
    stages: {
      uploaded: true,
      audioExtracted: false,
      sttDone: false,
      videoAnalyzed: false,
      audioAnalyzed: false,
      llmEvaluated: false,
      done: false,
      failed: false
    }
  });

  if (!questionResult) {
    return responseHelper(res, 500, "Failed", "Failed to create question result.", {
      data: {
        questionResult: null,
      },
    });
  }

  const { status, stages: { uploaded }, _id: questionResultId } = questionResult;

  // Enqueue background jobs for processing (STT, analysis, LLM evaluation, etc.) here

  const newTask = await TaskModel.create({
    userId: userId,
    type: "speech_to_text",
    payload: { questionResultId: (questionResult._id as string).toString() },
    status: "pending"
  })

  if (!newTask) {
    console.log("ERROR :: Task not created")
    return;
  }

  sendToQueue(SPEECH_TO_TEXT_QUEUE, (newTask._id as string).toString());

  return responseHelper(res, 200, "Success", "Question result created successfully.", {
    data: {
      questionResult: {
        status, stages: { uploaded }, _id: questionResultId
      }
    },
  });
});

const createInterviewQuestionResultForSkipQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { interviewId, questionId, questionText, } = req.body;

  if (!interviewId || !questionId || !questionText) {
    console.log("missing")
    return responseHelper(res, 400, "Failed", "Missing required fields.");
  }

  if (!isValidObjectId(interviewId)) {
    return responseHelper(res, 400, "Failed", "Invalid interview ID.");
  }

  const interview = await InterviewModel.findById(interviewId);
  if (!interview) {
    return responseHelper(res, 404, "Failed", "Interview not found.");
  }
  const questionResultExists = await QuestionResultModel.findOne({
    interviewId,
    questionId,
  });

  if (questionResultExists) {
    return responseHelper(res, 400, "Failed", "Question result already exists.");
  }

  // db call to create a new question result document
  const questionResult = await QuestionResultModel.create({
    interviewId,
    questionId,
    questionText,
    status: "DONE",
    stages: {
      uploaded: true,
      audioExtracted: true,
      sttDone: true,
      videoAnalyzed: true,
      llmEvaluated: true,
      done: true,
      failed: false
    }
  });

  if (!questionResult) {
    return responseHelper(res, 500, "Failed", "Failed to create question result.", {
      data: {
        questionResult: null,
      },
    });
  }

  return responseHelper(res, 200, "Success", "Question result created successfully for skip question.", {
    data: {
      questionResult: {
        status: questionResult.status, stages: questionResult.stages, _id: questionResult._id
      }
    },
  });
})

export {
  scheduleInterview,
  getTodayCandidateInterviews,
  getAllCandidateInterviews,
  getCandidateInterviewById,
  createInterviewQuestionResult,
  createInterviewQuestionResultForSkipQuestions
};
