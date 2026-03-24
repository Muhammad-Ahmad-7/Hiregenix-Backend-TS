import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { checkFaceVerification, createInterviewQuestionResult, createInterviewQuestionResultForSkipQuestions, createLivenessCheck, getAllCandidateInterviews, getCandidateInterviewById, getTodayCandidateInterviews, scheduleInterview } from "../controllers/interview.controller.js";
import { isCandidate } from "../middlewares/candidate.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { createInterviewQuestionResultForSkipQuestionsSchema, CreateInterviewQuestionResultSchema } from "../validators/interview.validator.js";
import upload, { memoryUpload } from "../middlewares/multer.middleware.js";

const interviewRouter = express.Router();

interviewRouter.post("/schedule-interview/:jobId", isLoggedIn, isCandidate, scheduleInterview);
interviewRouter.get("/candidate-interviews/today", isLoggedIn, isCandidate, getTodayCandidateInterviews);
interviewRouter.get("/candidate-interviews", isLoggedIn, isCandidate, getAllCandidateInterviews);
interviewRouter.get("/candidate-interviews/:interviewId", isLoggedIn, isCandidate, getCandidateInterviewById);
interviewRouter.post("/submit-answer", isLoggedIn, isCandidate, validateRequest(CreateInterviewQuestionResultSchema), createInterviewQuestionResult);
interviewRouter.post("/submit-skip-question", isLoggedIn, isCandidate, validateRequest(createInterviewQuestionResultForSkipQuestionsSchema), createInterviewQuestionResultForSkipQuestions);
interviewRouter.post("/liveness-check", isLoggedIn, isCandidate, createLivenessCheck);
interviewRouter.post("/face-verification", isLoggedIn, isCandidate, memoryUpload.single("file"), checkFaceVerification);
export default interviewRouter;