import { Request, response, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IUserInput } from "../types/user.types.js";
import { User } from "../models/user.model.js";

const signup = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password }: IUserInput = req.body

    let existingUser = await User.findOne({ 'email': email })

    if (existingUser) {
        return responseHelper(res, 400, false, "User Already Exist with this email")
    }

    existingUser = await User.findOne({ 'username': username });

    if (existingUser) {
        return responseHelper(res, 400, false, "Username already exist.")
    }

    const user = await User.create({
        username,
        email,
        password
    })


    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        return responseHelper(res, 400, false, "Error creating the user.")
    }

    return responseHelper(res, 200, true, "User created successfully", { data: { createdUser } })

})


const login = asyncHandler(async (req: Request, res: Response) => {
    // return responseHelper<{ token: string }>(res, 200, true, "Login successful", { data: { token: "dummy-token" } });
    throw new Error("Login not implemented yet");
})



export { login, signup };