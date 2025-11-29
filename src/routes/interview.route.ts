import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { scheduleInterview } from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

interviewRouter.post("/schedule-interview/:jobId", isLoggedIn, scheduleInterview);


export default interviewRouter;