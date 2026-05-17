import { Router } from "express";
import { getTask } from "../controllers/task.controller.js";

const taskRouter = Router();

taskRouter.get("/:taskId", getTask);

export default taskRouter;