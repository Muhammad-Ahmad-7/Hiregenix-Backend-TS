import { Request, Response, NextFunction } from "express";
import responseHelper from "../utils/responseHelper.js";

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
    console.error("❌ Error:: ", err);

    return responseHelper(res, err.statusCode || 500, "Failed", err.message || "Internal Server Error");
}
