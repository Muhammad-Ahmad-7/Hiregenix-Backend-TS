import express from "express";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { companyProfileCreationSchema, getJobByIdSchema, jobCreationSchema, jobDeletionSchema, updateJobSchema } from "../validators/company.validator.js";
import { createJob, deleteJob, getActiveJobs, getAllAppliedJobsOfCandidate, getAllJobs, getAllJobsWithPagination, getJobById, getRecommendedJobs, updateJobById } from "../controllers/job.controller.js";

const jobRouter = express.Router()

jobRouter.post("/create-job", isLoggedIn, isCompany, validateRequest(jobCreationSchema), createJob);
jobRouter.get("/get-all-jobs", isLoggedIn, isCompany, getAllJobsWithPagination);
jobRouter.get("/get-job-by-id", isLoggedIn, isCompany, validateRequest(getJobByIdSchema), getJobById);
jobRouter.patch("/update-job-by-id/:jobId", isLoggedIn, isCompany, validateRequest(updateJobSchema), updateJobById);
jobRouter.delete("/delete-job", isLoggedIn, isCompany, validateRequest(jobDeletionSchema), deleteJob);
jobRouter.get("/get-active-jobs", isLoggedIn, isCompany, getActiveJobs);
jobRouter.get("/recommended-jobs", isLoggedIn, getRecommendedJobs);
jobRouter.get("/all-applied-jobs", isLoggedIn, getAllAppliedJobsOfCandidate);
jobRouter.get("/all", isLoggedIn, getAllJobs);

export default jobRouter;