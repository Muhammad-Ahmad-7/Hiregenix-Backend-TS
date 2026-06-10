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
import { sendVerificationEmail } from "../services/resend.email.service.js";


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
        // await sendVerificationEmail(email, verificationToken);
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
            companyName: user.email.split('@')[0] + " Inc." // Placeholder company name based on email
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

const forgetPassword = asyncHandler(async (req: Request, res: Response) => {
    // Get the user email from the request body

    const { email } = req.body;

    // Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
        return responseHelper(res, 404, "Failed", "User not found");
    }
    // Generate a password reset 4 digit otp and store it in the database with an expiration time of 15 minutes
    const resetOtp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    await user.save();
    // Send the otp to the user's email
    try {
        await EmailService.sendPasswordResetOtp(email, "User", resetOtp);
        console.log('Password reset OTP email sent successfully.');
        return responseHelper(res, 200, "Success", "Password reset OTP sent to your email.");
    } catch (emailError) {
        console.error('Failed to send password reset OTP email:', emailError);
        return responseHelper(res, 500, "Failed", "Failed to send password reset OTP. Please try again later.");
    }
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {

    // Get the user email, otp and new password from the request body
    const { email, otp, newPassword } = req.body;


    // Find the user by email
    const user = await User.findOne({ email });
    // Check if the user exists
    if (!user) {
        return responseHelper(res, 404, "Failed", "User not found");
    }

    // Social auth users cannot reset password using OTP

    if (user.authProvider !== "local") {
        return responseHelper(res, 400, "Failed", "Social login accounts cannot reset passwords via OTP.");
    }

    // Check if the OTP is valid and not expired

    const isOtpValid = user.resetPasswordOtp === otp && user.resetPasswordOtpExpires && user.resetPasswordOtpExpires > new Date();

    if (!isOtpValid) {
        return responseHelper(res, 400, "Failed", "Invalid or expired OTP");
    }

    // If valid, update the user's password and clear the OTP fields
    user.password = newPassword // Only set password for local auth users
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();
    // Return a success response
    return responseHelper(res, 200, "Success", "Password reset successful. You can now log in with your new password.");
});
export { login, signup, verifyEmail, googleAuth, forgetPassword, resetPassword };