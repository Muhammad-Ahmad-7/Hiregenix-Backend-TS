import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SALT_ROUND } from "../utils/constant.js";
import { config } from "../config/config.js";
import CandidateModel from "./candidate.model.js";
import CompanyModel from "./company.model.js";

export interface IUser extends Document {
    email: string;
    username: string;
    password?: string; // only for local
    authProvider: "local" | "google" | "linkedin";
    providerId?: string; // for google/linkedin
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    isVerified: boolean;
    verificationToken: string | null;
    verificationTokenExpires: Date | null;
    role: "admin" | "candidate" | "company";
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: function () {
                return this.authProvider === "local"; // password required only for local
            },
            minlength: [8, "Password must be at least 8 characters long."],
        },
        authProvider: {
            type: String,
            enum: ["local", "google", "linkedin"],
            default: "local",
        },
        providerId: {
            type: String, // store Google/LinkedIn id here
        },
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: { type: String, default: null },
        verificationTokenExpires: { type: Date, default: null },
        refreshToken: {
            type: String,
        },
        role: {
            type: String,
            enum: ["admin", "candidate", "company"],
            default: "candidate",
        },
    },
    { timestamps: true }
);


// 🔐 Pre-save middleware for hashing password
UserSchema.pre<IUser>("save", async function (next) {
    if (this.authProvider !== "local") return next(); // skip hashing for Google/LinkedIn
    if (!this.isModified("password")) return next();

    if (this.password) {
        this.password = await bcrypt.hash(this.password, SALT_ROUND);
    }
    next();
});


// 🔑 Method: check password correctness
UserSchema.methods.isPasswordCorrect = async function (
    password: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

interface JwtPayload {
    _id: string;
    email: string;
    username: string;
    role: "admin" | "candidate" | "company";
    userId: string;
}

// 🔑 Generate Access Token
UserSchema.methods.generateAccessToken = async function (this: IUser): Promise<string> {
    let userId = null;

    if (this.role === "candidate") {
        const candidate = await CandidateModel.findOne({ userId: this._id });
        userId = candidate?._id;
    } else if (this.role === "company") {
        const company = await CompanyModel.findOne({ userId: this._id });
        userId = company?._id;
    }

    const payload: JwtPayload = {
        _id: this._id as string,
        email: this.email,
        username: this.username,
        role: this.role,
        userId: userId ? userId.toString() : "",
    };

    return jwt.sign(payload, config.jwt.accessTokenSecret, {
        expiresIn: config.jwt.accessTokenExpiresIn,
    } as jwt.SignOptions);
};

// 🔑 Generate Refresh Token
// UserSchema.methods.generateRefreshToken = function (this: IUser): string {
//     const payload = { _id: this._id as string };

//     return jwt.sign(payload, config.jwt.refreshTokenSecret, {
//         expiresIn: config.jwt.refreshTokenExpiresIn,
//     } as jwt.SignOptions);
// };

export const User = mongoose.model<IUser>("User", UserSchema);
