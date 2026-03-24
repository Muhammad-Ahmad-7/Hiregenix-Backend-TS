import { Router } from "express";
import {
  getMessages,
  getMessages2,
} from "../controllers/message.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";

const messageRoute = Router();

messageRoute.use(isLoggedIn);

messageRoute.get("/chat/:chatId", getMessages);

messageRoute.get("/chat2/:chatId", getMessages2);
export default messageRoute;
