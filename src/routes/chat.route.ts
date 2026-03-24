import { Router } from "express";
import { getChats, getOrCreateChat } from "../controllers/chat.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
const chatRouter = Router();

chatRouter.use(isLoggedIn);
chatRouter.get("/", getChats);
chatRouter.post("/with/:participantId", getOrCreateChat);

export default chatRouter;
