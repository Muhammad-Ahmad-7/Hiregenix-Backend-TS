import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";
import { TaskModel } from "../models/task.model.js";

const getTask = asyncHandler(async (req: Request, res: Response) => {
    // get the task id from the request params

    const taskId = req.params.taskId;

    if (!taskId) {
        return responseHelper(res, 400, "Failed", "Task id is required.");
    }

    // fetch the task from the database using the task id

    const task = await TaskModel.findById(taskId);

    // if the task is not found, return a 404 error

    if (!task) {
        return responseHelper(res, 404, "Failed", "Task not found.");
    }

    // if the task is found, return the task details in the response

    return responseHelper(res, 200, "Success", "Task details fetched successfully.", {
        data: {
            task
        }
    });
});

export { getTask };