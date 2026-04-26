import { Request, response, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IUserInput, IUserLogin } from "../types/user.types.js";
import { User } from "../models/user.model.js";
import { EmailService } from "../services/email.service.js";
import * as crypto from "node:crypto";
import CandidateModel from "../models/candidate.model.js";
import CompanyModel from "../models/company.model.js";
import axios from "axios";
import oauth2Client from "../utils/googleClient.js";


const signup = asyncHandler(async (req: Request, res: Response) => {

    const { email, password, role }: IUserInput = req.body

    let existingUser = await User.findOne({ 'email': email })

    if (existingUser) {
        return responseHelper(res, 400, "Failed", "Email is already registered. Please log in or use a different email.")
    }

    // Verify SMTP connection
    const isEmailServiceWorking = await EmailService.verifyConnection();
    if (!isEmailServiceWorking) {
        return responseHelper(res, 503, "Failed", "Email service is currently unavailable. Please try again later.")
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
        console.log('Verification email sent successfully.');
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
            accessToken,
            role: user.role,
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

    let isProfileCompleted = false;

    if (user.role === "candidate") {
        const candidate = await CandidateModel.findOne({ userId: user._id });

        if (!candidate) {
            return responseHelper(res, 400, "Failed", "Candidate not found.");
        }

        isProfileCompleted = candidate.isProfileCompleted;
    } else {
        const company = await CompanyModel.findOne({ userId: user._id });
        if (!company) {
            return responseHelper(res, 400, "Failed", "Company not found.");
        }
        isProfileCompleted = company.isProfileCompleted;
    }

    return responseHelper(res, 200, "Success", "Login successful.", {
        data: {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isProfileCompleted
            }
        }
    })
})

const googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code;
    const role = req.query.role as string;
    const googleRes = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const { email } = userRes.data;

    let user = await User.findOne({ email });
    let _new = false;

    if (!user) {
        user = await User.create({
            email,
            authProvider: "google",
            providerId: userRes.data.id,
            isVerified: true,
            role: role === "company" ? "company" : "candidate",
        });
        _new = true;
        if (role === "company") {
            await CompanyModel.create({
                userId: user._id,
                companyName: "Placeholder Company Name"
            })
        } else {
            await CandidateModel.create({
                userId: user._id,
                fullName: "Placeholder Name"
            })
        }
    }
    const token = await user.generateAccessToken()
    return responseHelper(res, 200, "Success", "Login successful.", {
        data: {
            accessToken: token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            new: _new
        }
    })
});

export { login, signup, verifyEmail, googleAuth };