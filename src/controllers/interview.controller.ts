import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { JobModel } from "../models/job.model.js";
import responseHelper from "../utils/responseHelper.js";
import { InterviewModel } from "../models/interview.model.js";
import QuestionResultModel from "../models/question-result.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { TaskModel } from "../models/task.model.js";
import { LIVENESS_CHECK_QUEUE, SEND_HIRING_EMAIL_QUEUE, SEND_REJECTION_EMAIL_QUEUE, SPEECH_TO_TEXT_QUEUE, TIMEZONE } from "../utils/constant.js";
import { sendToQueue } from "../config/rabbitmq.js";
import CandidateModel from "../models/candidate.model.js";
import compareFaces from "../services/faceVerification.service.js";
import { DateTime } from "luxon";
import generateQuestionsForInterview from "../services/interviewQuestionsGeneration.service.js";
import ResumeModel from "../models/resume.model.js";
import { ReportModel } from "../models/reports.model.js";
import { generateVerificationSummary } from "../utils/utils.js";

const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
  // Implementation for scheduling interview

  const userId = req.userId;

  if (!userId) {
    return responseHelper(res, 401, "Failed", "Unauthorized access.");
  }

  const candidate = await CandidateModel.findById(userId);

  if (!candidate) {
    return responseHelper(res, 404, "Failed", "Candidate not found.");
  }

  // find the candidate resume is uploaded or not 

  const resume = await ResumeModel.findOne({ candidateId: userId });

  if (!resume) {
    return responseHelper(res, 400, "Failed", "Candidate profile is incomplete. Resume not found.");
  }

  if (!candidate.resumeId) {
    return responseHelper(res, 400, "Failed", "Candidate profile is incomplete. Resume not found.");
  }

  const { jobId } = req.params;
  const { scheduledDate } = req.body;

  console.log("date send ", scheduledDate)

  const job = await JobModel.findById(jobId);

  if (!job) {
    return responseHelper(res, 404, "Failed", "Job not found.");
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


  const existingInterview = await InterviewModel.findOne({ candidateId: userId, jobId: job._id });

  if (existingInterview) {
    const newInterview = await InterviewModel.findOneAndUpdate(
      { _id: existingInterview._id },
      {
        scheduledDate: scheduledDate ? scheduledDateUTC : undefined,
        status: scheduledDate ? "scheduled" : "pending",
      },
      { new: true }
    );

    if (!newInterview) {
      return responseHelper(res, 500, "Failed", "Failed to reschedule existing interview.");
    }

    return responseHelper(
      res,
      200,
      "Success",
      "Interview rescheduled successfully.",
      {
        data: {
          interview: newInterview,
        },
      }
    );
  }

  // No existing interview, create a new one
  // Generate questions for the interview based on the job requirements and candidate profile 

  const { title, role, experienceLevel, interviewGuideline, requiredSkills, requirements } = job;

  const { resumeId } = candidate;

  const questions = await generateQuestionsForInterview({ title, role, experienceLevel, interviewGuideline, requiredSkills, requirements, resumeId: resumeId.toString() });

  if (!questions || questions.length === 0) {
    return responseHelper(res, 500, "Failed", "Failed to generate interview questions.");
  }

  const predefinedQuestions = [
    `Hi ${candidate.fullName}, can you briefly introduce yourself and your recent work?`,
    `That's great to hear ${candidate.fullName}, how would you describe your professional journey?`,
    `give me a quick overview of your skills and experience.`
  ];

  const interviewQuestions = [...predefinedQuestions, ...questions.questions];

  console.log("Interview Questions", interviewQuestions);
  console.log("length of interview questions", interviewQuestions.length);


  const interview = await InterviewModel.create({
    candidateId: userId,
    jobId: job._id,
    companyId: companyId,
    type: "live",
    scheduledDate: scheduledDate ? scheduledDateUTC : undefined,
    status: scheduledDate ? "scheduled" : "pending",
    questions: interviewQuestions,
    totalQuestions: interviewQuestions.length
  });

  console.log("Interview", interview);

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

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const status = req.query.status as string | undefined;

    // ✅ Combined match (ALL filters in ONE place)
    const baseMatch = {
      candidateId: new mongoose.Types.ObjectId(userId),
      ...(status ? { status } : {}),
    };

    console.log("Base MATCH FILTER", baseMatch);

    // ✅ Aggregation
    const interviews = await InterviewModel.aggregate([
      {
        $match: baseMatch, // 🔥 ALL filters BEFORE pagination
      },

      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },

      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: "$company" },

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
        },
      },

      {
        $lookup: {
          from: "interviews",
          let: { currentJobId: "$jobId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$jobId", "$$currentJobId"] },
              },
            },
            {
              $group: {
                _id: "$candidateId",
              },
            },
            {
              $count: "totalApplicants",
            },
          ],
          as: "jobApplicantStats",
        },
      },
      {
        $addFields: {
          totalApplicants: {
            $ifNull: [{ $arrayElemAt: ["$jobApplicantStats.totalApplicants", 0] }, 0],
          },
        },
      },

      {
        $sort: { scheduledDate: 1 }, // sort AFTER filtering
      },

      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          _id: 1,
          rank: 1,
          totalApplicants: 1,
          candidateId: 1,
          jobId: 1,
          companyId: 1,
          type: 1,
          scheduledDate: 1,
          status: 1,
          job: 1,
          "company.companyName": 1,
          "company.logoUrl": 1,
          "report._id": 1,
          "report.topStrengths": 1,
          "report.topWeaknesses": 1,
          "report.overallImprovementSuggestions": 1,
        },
      },
    ]);

    const totalInterviews = await InterviewModel.countDocuments(baseMatch);

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
        page,
        limit,
        totalPages: Math.ceil(totalInterviews / limit),
      }
    );
  }
);

const getCandidateInterviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { interviewId } = req.params;

    const interview = await InterviewModel.findByIdAndUpdate(
      interviewId,
      { status: "scheduled" }, // 1. The update object
      { new: true, runValidators: true } // 2. Options: return the updated doc & validate
    )
      .populate("jobId", "title role workMode deadline")
      .populate("companyId", "companyName logoUrl");
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
  const { interviewId, questionId, questionText, videoUrl, numberOfTabSwitch, verificationEvents } = req.body;

  console.log("Received body:", req.body);

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

  let verificationSummary = null;
  if (verificationEvents) {
    verificationSummary = generateVerificationSummary(verificationEvents);
  }

  console.log("verification summary", verificationSummary);

  // db call to create a new question result document
  const questionResult = await QuestionResultModel.create({
    interviewId,
    questionId,
    questionText,
    videoUrl,
    numberOfTabSwitch,
    verificationSummary,
    verificationEvents,
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

  // Default LLM analysis for skipped questions
  const defaultLLMAnalysis = {
    scores: {
      contentScore: 0,
      communicationScore: 0,
      fluencyScore: 0,
      confidenceScore: 0,
      overallScore: 0,
    },
    fluencyAssessment: {
      grammarQuality: "",
      speechFlow: "",
      paceAssessment: "",
      detectedIssues: [],
    },
    insights: {
      strengths: [],
      weaknesses: [],
      missingConcepts: [],
      improvementSuggestions: [],
    },
    answerQuality: "Skipped - No answer provided",
    integrity: {
      integrityConcern: false,
      integrityNotes: null,
    },
    shortSummary: "Candidate skipped this question, so no answer was provided for analysis.",
  };

  // db call to create a new question result document with default LLM analysis
  const questionResult = await QuestionResultModel.create({
    interviewId,
    questionId,
    questionText,
    lLMAnalysis: defaultLLMAnalysis,
    status: "DONE",
    stages: {
      uploaded: true,
      audioExtracted: true,
      sttDone: true,
      videoAnalyzed: true,
      llmEvaluated: true,
      done: true,
      failed: false,
    },
  });

  if (!questionResult) {
    return responseHelper(res, 500, "Failed", "Failed to create question result.", {
      data: {
        questionResult: null,
      },
    });
  }

  // Now increment the counter for completedQuestions in the interview document
  interview.completedQuestions = (interview.completedQuestions || 0) + 1;
  await interview.save();

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

const sendHiringEmail = asyncHandler(async (req: Request, res: Response) => {
  const { interviewId, emailQuery } = req.body;

  if (!interviewId || !emailQuery) {
    return responseHelper(res, 400, "Failed", "Missing required fields.");
  }

  const interview = await InterviewModel.findByIdAndUpdate(interviewId, {
    status: "hired",
  }, { new: true }).populate({
    path: "candidateId",
    select: "userId fullName contactNumber",
    populate: {
      path: "userId",
      select: "email",
    }
  }).populate({
    path: "companyId",
    select: "userId companyName logoUrl",
    populate: {
      path: "userId",
      select: "email",
    }
  });

  if (!interview) {
    return responseHelper(res, 404, "Failed", "Interview not found.");
  }

  const email = (interview.candidateId as any).userId.email;
  const companyEmail = (interview.companyId as any).userId.email;
  const companyName = (interview.companyId as any).companyName;
  const candidateName = (interview.candidateId as any).fullName;
  const logoUrl = (interview.companyId as any).logoUrl;
  const contactNumber = (interview.candidateId as any).contactNumber;



  const task = await TaskModel.create({
    userId: req.userId,
    type: "send_hiring_email",
    payload: { email, emailQuery, companyEmail, companyName, candidateName, logoUrl, contactNumber },
    status: "pending"
  })

  if (!task) {
    console.log("ERROR :: Task not created for sending hiring email")
    return;
  }

  sendToQueue(SEND_HIRING_EMAIL_QUEUE, task._id.toString());

  return responseHelper(res, 200, "Success", "Hiring email is sent.", {
    data: {
      taskId: task._id,
    },
  });

});


const sendRejectionEmail = asyncHandler(async (req: Request, res: Response) => {
  const { interviewId } = req.body;

  if (!interviewId) {
    return responseHelper(res, 400, "Failed", "Missing required fields.");
  }

  const interview = await InterviewModel.findByIdAndUpdate(interviewId, {
    status: "rejected",
  }, { new: true }).populate({
    path: "candidateId",
    select: "userId fullName",
    populate: {
      path: "userId",
      select: "email",
    }
  }).populate({
    path: "companyId",
    select: "userId companyName logoUrl",
    populate: {
      path: "userId",
      select: "email",
    }
  });

  if (!interview) {
    return responseHelper(res, 404, "Failed", "Interview not found.");
  }

  const email = (interview.candidateId as any).userId.email;
  const companyEmail = (interview.companyId as any).userId.email;
  const companyName = (interview.companyId as any).companyName;
  const logoUrl = (interview.companyId as any).logoUrl;
  const candidateName = (interview.candidateId as any).fullName;



  const task = await TaskModel.create({
    userId: req.userId,
    type: "send_rejection_email",
    payload: { email, companyEmail, companyName, candidateName, logoUrl },
    status: "pending"
  })

  if (!task) {
    console.log("ERROR :: Task not created for sending rejection email")
    return;
  }

  sendToQueue(SEND_REJECTION_EMAIL_QUEUE, task._id.toString());

  return responseHelper(res, 200, "Success", "Rejection email is sent.", {
    data: {
      taskId: task._id,
    },
  });

});

const endInterview = asyncHandler(async (req: Request, res: Response) => {
  // Get the interview id from the req.body

  const { interviewId } = req.body;

  // Check the id is valid or not

  if (!interviewId || !isValidObjectId(interviewId)) {
    return responseHelper(res, 400, "Failed", "Missing interview ID.");
  }

  // Fetch the interview doc from the interviewModel based on the provided id

  const interviewDoc = await InterviewModel.findById(interviewId);

  // Check if the interview exists or not, if not return with error message

  if (!interviewDoc) {
    return responseHelper(res, 404, "Failed", "Interview not found.");
  }

  // Update the interview status to "end" and save the doc

  interviewDoc.status = "ended";

  await interviewDoc.save();

  // Return the response with success message and updated interview data

  return responseHelper(res, 200, "Success", "Your interview has ended.", {
    data: null,
  });
})

const markInterviewAsInProcess = asyncHandler(async (req: Request, res: Response) => {
  const { interviewId } = req.body;

  if (!interviewId || !isValidObjectId(interviewId)) {
    console.log("Invalid interview ID for marking in process");
    return;
  }

  const interview = await InterviewModel.findById(interviewId);

  if (!interview) {
    console.log("Interview not found for marking in process");
    return;
  }

  interview.status = "in-process";

  await interview.save();

  return responseHelper(res, 200, "Success", "Interview marked as in process.", {
    data: null,
  });
});

const fetchInterviewQuestionResults = asyncHandler(async (req: Request, res: Response) => {
  const { interviewId } = req.params;
  if (!interviewId || !isValidObjectId(interviewId)) {
    return responseHelper(res, 400, "Failed", "Invalid interview ID.");
  }

  const questionResults = await QuestionResultModel.find({ interviewId }, {
    questionId: 1,
    questionText: 1,
    videoUrl: 1,
    lLMAnalysis: 1,
    "sttData.text": 1,
  });

  if (!questionResults) {
    return responseHelper(res, 404, "Failed", "No question results found for this interview.");
  }

  const report = await ReportModel.findOne({ interviewId }, {
    overallImprovementSuggestions: 1,
    topStrengths: 1,
    topWeaknesses: 1,
    commonMissingConcepts: 1,
    interviewSummary: 1,
    pdfUrl: 1,
  });

  if (!report) {
    console.log("No report found for interview ID:", interviewId);
  }

  return responseHelper(res, 200, "Success", "Question results fetched successfully.", {
    data: {
      questionResults,
      report,
    },
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
  checkFaceVerification,
  sendHiringEmail,
  sendRejectionEmail,
  endInterview,
  markInterviewAsInProcess,
  fetchInterviewQuestionResults,
};
