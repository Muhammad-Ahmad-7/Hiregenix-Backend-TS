import express from "express";
import { completeCompanyProfile, createJob, deleteJob, getActiveJobs, getAllJobsWithPagination, getDashboardStats, getJobById, updateJobById } from "../controllers/company.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { companyProfileCreationSchema, getJobByIdSchema, jobCreationSchema, jobDeletionSchema, updateJobSchema } from "../validators/company.validator.js";

const companyRouter = express.Router()


companyRouter.post("/complete-profile", isLoggedIn, isCompany, validateRequest(companyProfileCreationSchema), completeCompanyProfile)
companyRouter.post("/create-job", isLoggedIn, isCompany, validateRequest(jobCreationSchema), createJob);
companyRouter.get("/get-all-jobs", isLoggedIn, isCompany, getAllJobsWithPagination);
companyRouter.get("/get-job-by-id", isLoggedIn, isCompany, validateRequest(getJobByIdSchema), getJobById);
companyRouter.patch("/update-job-by-id/:jobId", isLoggedIn, isCompany, validateRequest(updateJobSchema), updateJobById);
companyRouter.delete("/delete-job", isLoggedIn, isCompany, validateRequest(jobDeletionSchema), deleteJob);
companyRouter.get("/get-active-jobs", isLoggedIn, isCompany, getActiveJobs);
companyRouter.get("/get-dashboard-stats", isLoggedIn, isCompany, getDashboardStats);


export default companyRouter;