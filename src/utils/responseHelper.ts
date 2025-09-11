import { Response } from "express";
import { ApiResponseData } from "../types/api.js";

export default function responseHelper<T>(res: Response, statusCode: number, success: boolean, message: string, data?: ApiResponseData<T>) {
    return res.status(statusCode).json({ success, message, statusCode, ...data });
}