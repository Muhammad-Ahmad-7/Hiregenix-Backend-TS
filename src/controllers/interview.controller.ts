import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { JobModel } from "../models/job.model.js";
import responseHelper from "../utils/responseHelper.js";
import { InterviewModel } from "../models/interview.model.js";
import QuestionResultModel from "../models/question-result.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { TaskModel } from "../models/task.model.js";
import { LIVENESS_CHECK_QUEUE, SPEECH_TO_TEXT_QUEUE, TIMEZONE } from "../utils/constant.js";
import { sendToQueue } from "../config/rabbitmq.js";
import CandidateModel from "../models/candidate.model.js";
import compareFaces from "../services/faceVerification.service.js";
import { DateTime } from "luxon";

const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for scheduling interview

  const userId = req.userId;

  const { jobId } = req.params;

  const job = await JobModel.findById(jobId);

  if (!job) {
    return responseHelper(res, 404, "Failed", "Job not found.");
  }

  const existingInterview = await InterviewModel.findOne({ candidateId: userId, jobId: job._id });

  if (existingInterview) {
    return responseHelper(res, 400, "Failed", "Interview already scheduled for this job.");
  }

  const nowDateZone = DateTime.now().setZone(TIMEZONE);
  const jobDeadlineZone = job.deadline ? DateTime.fromJSDate(job.deadline).setZone(TIMEZONE) : null;

  console.log("Current Date (User Zone):", nowDateZone.toString());
  console.log("Job Deadline (User Zone):", jobDeadlineZone?.toString());

  if (job.deadline && nowDateZone > jobDeadlineZone!) {
    return responseHelper(
      res,
      400,
      "Failed",
      "Cannot schedule interview for a job past its application deadline."
    );
  }

  const companyId = job.companyId;

  const { scheduledDate } = req.body;
  const userZone = TIMEZONE; // "Asia/Karachi"


  const scheduledZone = DateTime.fromISO(scheduledDate, { zone: userZone }).startOf("day");

  if (!scheduledZone.isValid) {
    return responseHelper(res, 400, "Failed", "Invalid scheduled date.");
  }

  const todayZone = DateTime.now().setZone(userZone).startOf("day");

  console.log("Scheduled Date (User Zone):", scheduledZone.toString());
  console.log("Today's Date (User Zone):", todayZone.toString());

  if (scheduledZone < todayZone) {
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
    scheduledZone > jobDeadlineZone!
  ) {
    return responseHelper(
      res,
      400,
      "Failed",
      "Scheduled time must be before the job application deadline."
    );
  }

  const scheduledDateUTC = scheduledZone.toUTC().toJSDate();

  console.log("Scheduled Date (UTC):", scheduledDateUTC.toISOString());

  const interview = await InterviewModel.create({
    candidateId: userId,
    jobId: job._id,
    companyId: companyId,
    type: "live",
    scheduledDate: scheduledDate ? scheduledDateUTC : undefined,
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

    const startZone = DateTime.now()
      .setZone(TIMEZONE) // right now its set for pakistan only, we can make it dynamic based on user preference in future
      .startOf("day")
      .toUTC()
      .toJSDate();

    const endZone = DateTime.now()
      .setZone(TIMEZONE)
      .endOf("day")
      .toUTC()
      .toJSDate();

    console.log("Start of day in UTC:", startZone);
    console.log("End of day in UTC:", endZone);

    const userId = req.userId;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    console.log("Start of day:", start);
    console.log("End of day:", end);

    const interviews = await InterviewModel.find({
      candidateId: userId,
      scheduledDate: { $gte: startZone, $lte: endZone },
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
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    // const interviews = await InterviewModel.find({ candidateId: userId, ...(status ? { status } : {}) })
    //   .populate("jobId", "title workMode deadline")
    //   .populate("companyId", "companyName")
    //   .sort({ scheduledDate: -1 })
    //   .skip(skip)
    //   .limit(limit);

    const interviews = await InterviewModel.aggregate([
      {
        $match: {
          candidateId: new mongoose.Types.ObjectId(userId),
          ...(status ? { status } : {})
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: "$job",
      },
      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $lookup: {
          from: "reports",
          localField: "_id",
          foreignField: "interviewId",
          as: "report",
        },
      },
      {
        $unwind: {
          path: "$report",
          preserveNullAndEmptyArrays: true,
        }
      },
      {
        $unwind: "$company",
      },
      {
        $sort: { scheduledDate: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          candidateId: 1,
          jobId: 1,
          companyId: 1,
          type: 1,
          scheduledDate: 1,
          status: 1,
          "report._id": 1,
          "report.topStrengths": 1,
          "report.topWeaknesses": 1,
          "report.overallImprovementSuggestions": 1,
          "job.title": 1,
          "job.workMode": 1,
          "job.deadline": 1,
          "company.companyName": 1,
          "company.logoUrl": 1,
        },
      }
    ])
    console.log("INTERVIEWS", interviews)
    if (!interviews) {
      return responseHelper(res, 500, "Failed", "Failed to fetch interviews.");
    }

    const totalInterviews = await InterviewModel.countDocuments({
      candidateId: userId,
      ...(status ? { status } : {})
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
    payload: { questionResultId: questionResult._id.toString() },
    status: "pending"
  })

  if (!newTask) {
    console.log("ERROR :: Task not created")
    return;
  }

  sendToQueue(SPEECH_TO_TEXT_QUEUE, newTask._id.toString());

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

const createLivenessCheck = asyncHandler(async (req: Request, res: Response) => {
  const { interviewId, videoUrl } = req.body;
  if (!interviewId) {
    return responseHelper(res, 400, "Failed", "Missing interview ID.");
  }
  const interview = await InterviewModel.findById(interviewId);
  if (!interview) {
    return responseHelper(res, 404, "Failed", "Interview not found.");
  }
  const updatedInterview = await InterviewModel.findByIdAndUpdate(interviewId, {
    livenessVideoUrl: videoUrl,
  }, { new: true });

  if (!updatedInterview) {
    return responseHelper(res, 500, "Failed", "Failed to update interview with liveness check.");
  }

  const task = await TaskModel.create({
    userId: req.userId,
    type: "liveness_check",
    payload: { interviewId: (updatedInterview._id).toString() },
    status: "pending"
  })

  if (!task) {
    console.log("ERROR :: Task not created for liveness check")
    return;
  }

  sendToQueue(LIVENESS_CHECK_QUEUE, task._id.toString());
  return responseHelper(res, 200, "Success", "Liveness check processing started.", {
    data: {
      taskId: task._id,
      interview: updatedInterview,
    },
  });
});

const checkFaceVerification = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

  const candidate = await CandidateModel.findById(userId);

  if (!candidate) {
    return responseHelper(res, 404, "Failed", "Candidate not found.");
  }

  if (!req.file) {
    return responseHelper(res, 400, "Failed", "No file uploaded.");
  }

  const liveImage = req.file.buffer;

  if (!candidate.profilePictureUrl) {
    return responseHelper(res, 400, "Failed", "No reference image found for candidate.");
  }

  const referenceImageUrl = candidate.profilePictureUrl;

  const result = await compareFaces(referenceImageUrl, liveImage);
  // console.log(result);

  const verificationData = {
    similarity: result.FaceMatches && result.FaceMatches.length > 0 ? result.FaceMatches[0]?.Similarity : 0,
  }

  return responseHelper(res, 200, "Success", "Face verification completed.", {
    data: {
      verificationResult: verificationData,
    }
  });

});

export {
  scheduleInterview,
  getTodayCandidateInterviews,
  getAllCandidateInterviews,
  getCandidateInterviewById,
  createInterviewQuestionResult,
  createInterviewQuestionResultForSkipQuestions,
  createLivenessCheck,
  checkFaceVerification
};
