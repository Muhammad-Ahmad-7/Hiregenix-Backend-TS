import express from "express";
import { completeCandidateProfile, getCandidateDashboardStats, getCandidateProfile, getCandidateProfileById, getResumeParsedData, resumeParser, updateCandidateProfile } from "../controllers/candidate.controller.js";
import upload from "../middlewares/multer.middleware.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCandidate, isResumeAlreadyUploaded } from "../middlewares/candidate.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { candidateProfileCreationSchema, candidateUpdateProfileSchema } from "../validators/candidate.validator.js";

const candidateRouter = express.Router();



candidateRouter.post("/complete-profile", isLoggedIn, validateRequest(candidateProfileCreationSchema), completeCandidateProfile);
candidateRouter.get("/profile/:userId", isLoggedIn, getCandidateProfileById);
candidateRouter.get("/profile", isLoggedIn, getCandidateProfile);
candidateRouter.patch("/update-profile", isLoggedIn, validateRequest(candidateUpdateProfileSchema), updateCandidateProfile);
candidateRouter.post("/resume", isLoggedIn, isResumeAlreadyUploaded, upload.single("file"), resumeParser);
candidateRouter.get("/get-resume-parsed-data", isLoggedIn, getResumeParsedData);
candidateRouter.get("/get-candidate-dashboard-stats", isLoggedIn, isCandidate, getCandidateDashboardStats);

export default candidateRouter;

