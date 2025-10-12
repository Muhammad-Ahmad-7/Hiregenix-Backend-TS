import express from "express";
import { completeCompanyProfile, createJob } from "../controllers/company.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { companyProfileCreationSchema, jobCreationSchema } from "../validators/company.validator.js";

const companyRouter = express.Router()


companyRouter.post("/complete-profile", isLoggedIn, isCompany, validateRequest(companyProfileCreationSchema), completeCompanyProfile)
companyRouter.post("/create-job", isLoggedIn, isCompany, validateRequest(jobCreationSchema), createJob);

export default companyRouter;