import { Request, response, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IUserInput, IUserLogin } from "../types/user.types.js";
import { User } from "../models/user.model.js";
import { EmailService } from "../services/email.service.js";
import crypto from "crypto"
import CandidateModel from "../models/candidate.model.js";
import CompanyModel from "../models/company.model.js";


const signup = asyncHandler(async (req: Request, res: Response) => {

    const { email, password, role }: IUserInput = req.body

    let existingUser = await User.findOne({ 'email': email })

    if (existingUser) {
        return responseHelper(res, 400, "Failed", "Invalid registration details.")
    }

    // Verify SMTP connection
    const isEmailServiceWorking = await EmailService.verifyConnection();
    if (!isEmailServiceWorking) {
        res.status(500).json({
            status: 'error',
            message: 'Email service is not available. Please try again later.',
        });
        return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({

        email,
        password,
        verificationToken,
        role,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })


    try {
        // Send verification email
        await EmailService.sendVerificationEmail(email, "User", verificationToken);

        return responseHelper(res, 201, "Success", "Registration successful. Please check your email to verify your account.")
    } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        await User.findByIdAndUpdate(user._id, {
            $set: {
                emailVerificationFailed: true
            }
        })
        return responseHelper(res, 201, "Success", "Account created but verification email could not be sent. Please contact support.")
    }
})

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params

    if (!token) {
        return responseHelper(res, 400, "Failed", "Invalid or missing token.")
    }

    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
    });
    if (!user) {
        return responseHelper(res, 400, "Failed", "Invalid or expired token.")
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    if (user.role === 'candidate') {
        const candidate = await CandidateModel.create({
            userId: user._id,
        })
        if (!candidate) {
            return responseHelper(res, 500, "Failed", "Error creating candidate profile.")
        }
    }

    if (user.role === 'company') {
        const company = await CompanyModel.create({
            userId: user._id,
            companyName: user.username
        })
        if (!company) {
            return responseHelper(res, 500, "Failed", "Error creating company profile.")
        }
    }

    // Admin Profile creation can be handled here if needed
    const accessToken = await user.generateAccessToken()
    return responseHelper(res, 200, "Success", "Email verified successfully. Your account is now active.", {
        data: {
            accessToken
        }
    })
})

const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: IUserLogin = req.body

    const user = await User.findOne({ email })

    if (!user || !(await user.isPasswordCorrect(password))) {
        return responseHelper(res, 401, "Failed", "Invalid email or password.")
    }

    if (!user.isVerified) {
        return responseHelper(res, 401, "Failed", "Email not verified. Please verify your email before logging in.")
    }

    const accessToken = await user.generateAccessToken()
    return responseHelper(res, 200, "Success", "Login successful.", {
        data: {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        }
    })
})

export { login, signup, verifyEmail };