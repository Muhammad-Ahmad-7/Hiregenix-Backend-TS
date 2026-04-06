import { Router } from "express";
import { companyChatBot } from "../controllers/companyChatBot.controller.js";

const chatbotRouter = Router();

// POST /api/company-chat
chatbotRouter.post("/company-chat", companyChatBot);

export default chatbotRouter;
