import express from "express";
import { completeCompanyProfile } from "../controllers/company.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import { isCompany } from "../middlewares/company.middleware.js";

const companyRouter = express.Router()


companyRouter.post("/complete-profile", isLoggedIn, isCompany, completeCompanyProfile)


export default companyRouter;