import express from "express";
import {
  completeCompanyProfile,
  getCompanyProfile,
  getDashboardStats,
  getAllCompanies,
  updatedCompanyProfile,
} from "../controllers/company.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  companyProfileCreationSchema,
  companyProfileUpdateSchema,
  getJobByIdSchema,
  jobCreationSchema,
  jobDeletionSchema,
  updateJobSchema,
} from "../validators/company.validator.js";
import { generateJobDataUsingAI } from "../controllers/job.controller.js";

const companyRouter = express.Router();

companyRouter.get("/all", getAllCompanies);
companyRouter.post(
  "/complete-profile",
  isLoggedIn,
  isCompany,
  validateRequest(companyProfileCreationSchema),
  completeCompanyProfile,
);
companyRouter.get(
  "/get-dashboard-stats",
  isLoggedIn,
  isCompany,
  getDashboardStats,
);
companyRouter.get("/profile", isLoggedIn, isCompany, getCompanyProfile);
companyRouter.patch(
  "/update-profile",
  isLoggedIn,
  isCompany,
  validateRequest(companyProfileUpdateSchema),
  updatedCompanyProfile,
);

export default companyRouter;
