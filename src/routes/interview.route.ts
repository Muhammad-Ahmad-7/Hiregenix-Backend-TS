import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { getAllCandidateInterviews, getTodayCandidateInterviews, scheduleInterview } from "../controllers/interview.controller.js";
import { isCandidate } from "../middlewares/candidate.middleware.js";

const interviewRouter = express.Router();

interviewRouter.post("/schedule-interview/:jobId", isLoggedIn, isCandidate, scheduleInterview);
interviewRouter.get("/candidate-interviews/today", isLoggedIn, isCandidate, getTodayCandidateInterviews);
interviewRouter.get("/candidate-interviews", isLoggedIn, isCandidate, getAllCandidateInterviews);

export default interviewRouter;