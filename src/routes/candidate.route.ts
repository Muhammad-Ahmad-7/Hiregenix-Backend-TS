import express from "express";
import { resumeParser } from "../controllers/candidate.controller.js";
import upload from "../middlewares/multer.middleware.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isResumeAlreadyUploaded } from "../middlewares/candidate.middleware.js";

const candidateRouter = express.Router();


candidateRouter.post("/resume", isLoggedIn, isResumeAlreadyUploaded, upload.single("file"), resumeParser);


export default candidateRouter;

