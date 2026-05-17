import express from "express";
import { addResumeData, completeCandidateProfile, deleteResumeData, editResumeData, getCandidateDashboardStats, getCandidateProfile, getCandidateProfileById, getResumeParsedData, resumeParser, updateCandidateProfile, getAllCandidates } from "../controllers/candidate.controller.js";
import upload from "../middlewares/multer.middleware.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCandidate, isResumeAlreadyUploaded } from "../middlewares/candidate.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { candidateProfileCreationSchema, candidateUpdateProfileSchema } from "../validators/candidate.validator.js";

const candidateRouter = express.Router();

candidateRouter.get("/all", getAllCandidates);
candidateRouter.get("/get-resume-parsed-data/:id",  getResumeParsedData);
candidateRouter.get("/profile/:userId",  getCandidateProfileById);
candidateRouter.post("/complete-profile", isLoggedIn, validateRequest(candidateProfileCreationSchema), completeCandidateProfile);

candidateRouter.get("/profile", isLoggedIn, getCandidateProfile);
candidateRouter.patch("/update-profile", isLoggedIn, validateRequest(candidateUpdateProfileSchema), updateCandidateProfile);
candidateRouter.post("/resume", isLoggedIn, isResumeAlreadyUploaded, upload.single("file"), resumeParser);
candidateRouter.get("/get-resume-parsed-data", isLoggedIn, getResumeParsedData);
candidateRouter.get("/get-candidate-dashboard-stats", isLoggedIn, isCandidate, getCandidateDashboardStats);
candidateRouter.post("/add-resume-data", isLoggedIn, addResumeData);
candidateRouter.patch("/edit-resume-data", isLoggedIn, editResumeData);
candidateRouter.delete("/delete-resume-data", isLoggedIn, deleteResumeData);

export default candidateRouter;

