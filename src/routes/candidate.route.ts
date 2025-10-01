import express from "express";
import { completeCandidateProfile, resumeParser } from "../controllers/candidate.controller.js";
import upload from "../middlewares/multer.middleware.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isResumeAlreadyUploaded } from "../middlewares/candidate.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { candidateProfileCreationSchema } from "../validators/candidate.validator.js";

const candidateRouter = express.Router();



candidateRouter.post("/complete-profile", isLoggedIn, validateRequest(candidateProfileCreationSchema), completeCandidateProfile);
candidateRouter.post("/resume", isLoggedIn, isResumeAlreadyUploaded, upload.single("file"), resumeParser);


export default candidateRouter;

