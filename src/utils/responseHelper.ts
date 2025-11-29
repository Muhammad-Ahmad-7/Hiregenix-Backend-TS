import { Response } from "express";
import { ApiResponseData } from "../types/api.js";

export default function responseHelper<T>(res: Response, statusCode: number, status: "Success" | "Failed", message: string, data?: ApiResponseData<T>, meta: any = {}) {
    return res.status(statusCode).json({ status, message, statusCode, ...data, meta });
}