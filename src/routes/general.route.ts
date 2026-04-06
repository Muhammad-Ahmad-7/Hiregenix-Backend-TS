import { Router } from "express";
import { companyChatBot } from "../controllers/companyChatBot.controller.js";
import { getCompanyProfileWithId } from "../controllers/general.controller.js";

const generalRouter = Router();

// POST /api/company-chat
generalRouter.post("/companyProfileWithId", getCompanyProfileWithId);

export default generalRouter;
