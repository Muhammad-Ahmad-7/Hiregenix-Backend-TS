import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { companyProfileCreationSchema, generateJobDataSchema, generateJobDataUsingAISchema, getJobByIdSchema, jobCreationSchema, jobDeletionSchema, updateJobSchema } from "../validators/company.validator.js";
import { createJob, deleteJob, getCompanyOpenJobs, getAllAppliedJobsOfCandidate, getAllJobs, getAllJobsWithPagination, getJobById, getRecommendedJobs, updateJobById, getCompanyClosedJobs, getInterviewApplicationsForJob, saveJobById, getSavedJobsOfCandidate, unSaveJobById, getAllCompanyJobs, generateJobDataUsingAI } from "../controllers/job.controller.js";
import { isCandidate } from "../middlewares/candidate.middleware.js";

const jobRouter = express.Router()

jobRouter.post("/create-job", isLoggedIn, isCompany, validateRequest(jobCreationSchema), createJob);
jobRouter.get("/get-all-jobs", isLoggedIn, getAllJobsWithPagination);
jobRouter.get("/get-job-by-id", isLoggedIn, isCompany, validateRequest(getJobByIdSchema), getJobById);
jobRouter.patch("/update-job-by-id/:jobId", isLoggedIn, isCompany, validateRequest(updateJobSchema), updateJobById);
jobRouter.delete("/delete-job", isLoggedIn, isCompany, validateRequest(jobDeletionSchema), deleteJob);
jobRouter.get("/get-company-jobs/open", isLoggedIn, isCompany, getCompanyOpenJobs);
jobRouter.get("/get-company-jobs/closed", isLoggedIn, isCompany, getCompanyClosedJobs);
jobRouter.get("/recommended-jobs", isLoggedIn, getRecommendedJobs);
jobRouter.get("/all-applied-jobs", isLoggedIn, getAllAppliedJobsOfCandidate);
jobRouter.get("/all", isLoggedIn, getAllJobs);
jobRouter.post("/save/:jobId", isLoggedIn, isCandidate, saveJobById);
jobRouter.get("/save", isLoggedIn, isCandidate, getSavedJobsOfCandidate);
jobRouter.delete("/unsave/:savedJobId", isLoggedIn, isCandidate, unSaveJobById);
jobRouter.get("/interview-applications/:jobId", isLoggedIn, isCompany, getInterviewApplicationsForJob);
jobRouter.get("/get-company-jobs", isLoggedIn, isCompany, getAllCompanyJobs);
jobRouter.post("/generate-job-ai", isLoggedIn, isCompany, validateRequest(generateJobDataUsingAISchema), generateJobDataUsingAI);

export default jobRouter;