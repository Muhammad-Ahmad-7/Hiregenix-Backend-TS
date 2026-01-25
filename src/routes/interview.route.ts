import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { createInterviewQuestionResult, getAllCandidateInterviews, getCandidateInterviewById, getTodayCandidateInterviews, scheduleInterview } from "../controllers/interview.controller.js";
import { isCandidate } from "../middlewares/candidate.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { CreateInterviewQuestionResultSchema } from "../validators/interview.validator.js";

const interviewRouter = express.Router();

interviewRouter.post("/schedule-interview/:jobId", isLoggedIn, isCandidate, scheduleInterview);
interviewRouter.get("/candidate-interviews/today", isLoggedIn, isCandidate, getTodayCandidateInterviews);
interviewRouter.get("/candidate-interviews", isLoggedIn, isCandidate, getAllCandidateInterviews);
interviewRouter.get("/candidate-interviews/:interviewId", isLoggedIn, isCandidate, getCandidateInterviewById);
interviewRouter.post("/submit-answer", isLoggedIn, isCandidate, validateRequest(CreateInterviewQuestionResultSchema), createInterviewQuestionResult);

export default interviewRouter;