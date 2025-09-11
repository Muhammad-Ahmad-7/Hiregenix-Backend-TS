import { Request, Response } from "express";
import responseHelper from "../utils/responseHelper.js";

const login = async (req: Request, res: Response) => {
    // return responseHelper<{ token: string }>(res, 200, true, "Login successful", { data: { token: "dummy-token" } });
    throw new Error("Login not implemented yet");
}
export { login };