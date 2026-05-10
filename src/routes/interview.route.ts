import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { checkFaceVerification, createInterviewQuestionResult, createInterviewQuestionResultForSkipQuestions, createLivenessCheck, endInterview, fetchInterviewQuestionResults, getAllCandidateInterviews, getCandidateInterviewById, getTodayCandidateInterviews, markInterviewAsInProcess, scheduleInterview, sendHiringEmail, sendRejectionEmail } from "../controllers/interview.controller.js";
import { isCandidate } from "../middlewares/candidate.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { createInterviewQuestionResultForSkipQuestionsSchema, CreateInterviewQuestionResultSchema } from "../validators/interview.validator.js";
import upload, { memoryUpload } from "../middlewares/multer.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";

const interviewRouter = express.Router();

interviewRouter.post("/schedule-interview/:jobId", isLoggedIn, isCandidate, scheduleInterview);
interviewRouter.get("/candidate-interviews/today", isLoggedIn, isCandidate, getTodayCandidateInterviews);
interviewRouter.get("/candidate-interviews", isLoggedIn, isCandidate, getAllCandidateInterviews);
interviewRouter.get("/candidate-interviews/:interviewId", isLoggedIn, isCandidate, getCandidateInterviewById);
interviewRouter.post("/submit-answer", isLoggedIn, isCandidate, validateRequest(CreateInterviewQuestionResultSchema), createInterviewQuestionResult);
interviewRouter.post("/submit-skip-question", isLoggedIn, isCandidate, validateRequest(createInterviewQuestionResultForSkipQuestionsSchema), createInterviewQuestionResultForSkipQuestions);
interviewRouter.post("/liveness-check", isLoggedIn, isCandidate, createLivenessCheck);
interviewRouter.post("/face-verification", isLoggedIn, isCandidate, memoryUpload.single("file"), checkFaceVerification);
interviewRouter.post("/send-hiring-email", isLoggedIn, isCompany, sendHiringEmail);
interviewRouter.post("/send-rejection-email", isLoggedIn, isCompany, sendRejectionEmail);
interviewRouter.post("/end-interview", isLoggedIn, isCandidate, endInterview);
interviewRouter.post("/mark-in-process", isLoggedIn, isCandidate, markInterviewAsInProcess);
interviewRouter.get("/interview-question-results/:interviewId", isLoggedIn, fetchInterviewQuestionResults);


export default interviewRouter;