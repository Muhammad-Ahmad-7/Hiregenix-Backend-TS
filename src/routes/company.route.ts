import express from "express";
import { completeCompanyProfile, getDashboardStats } from "../controllers/company.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { companyProfileCreationSchema, getJobByIdSchema, jobCreationSchema, jobDeletionSchema, updateJobSchema } from "../validators/company.validator.js";

const companyRouter = express.Router()


companyRouter.post("/complete-profile", isLoggedIn, isCompany, validateRequest(companyProfileCreationSchema), completeCompanyProfile)
companyRouter.get("/get-dashboard-stats", isLoggedIn, isCompany, getDashboardStats);


export default companyRouter;