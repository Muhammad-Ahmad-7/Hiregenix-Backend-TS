import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { getAllCandidateInterviews, getTodayCandidateInterviews, scheduleInterview } from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

interviewRouter.post("/schedule-interview/:jobId", isLoggedIn, scheduleInterview);
interviewRouter.get("/candidate-interviews/today", isLoggedIn, getTodayCandidateInterviews);
interviewRouter.get("/candidate-interviews", isLoggedIn, getAllCandidateInterviews);

export default interviewRouter;