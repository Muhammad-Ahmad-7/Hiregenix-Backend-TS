import express from "express";
import {
  completeCompanyProfile,
  getCompanyProfile,
  getDashboardStats,
  getAllCompanies,
  uploadCompanyKnowledgeBasePdf,
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
import upload from "../middlewares/multer.middleware.js";

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

companyRouter.post(
  "/knowledge-base/pdf",
  isLoggedIn,
  isCompany,
  upload.single("file"),
  uploadCompanyKnowledgeBasePdf,
);

export default companyRouter;
