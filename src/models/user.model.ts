import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SALT_ROUND } from "../utils/constant.js";
import { config } from "../config/config.js";

export interface IUser extends Document {
    email: string;
    username: string;
    password: string;
    role: "admin" | "user";
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long."],
        },
        refreshToken: {
            type: String,
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
        },
    },
    { timestamps: true }
);

// 🔐 Pre-save middleware for hashing password
UserSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, SALT_ROUND);
    next();
});

// 🔑 Method: check password correctness
UserSchema.methods.isPasswordCorrect = async function (
    password: string
): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

interface JwtPayload {
    _id: string;
    email: string;
    username: string;
    role: "admin" | "user";
}


UserSchema.methods.generateAccessToken = function (this: IUser): string {
    const payload: JwtPayload = {
        _id: this._id as string,
        email: this.email,
        username: this.username,
        role: this.role,
    };

    return jwt.sign(
        payload,
        config.jwt.accessTokenSecret,
        {
            expiresIn: config.jwt.accessTokenExpiresIn,
        } as jwt.SignOptions
    );
};

UserSchema.methods.generateRefreshToken = function (this: IUser): string {
    const payload = {
        _id: this._id,
    };

    return jwt.sign(
        payload,
        config.jwt.refreshTokenSecret,
        {
            expiresIn: config.jwt.refreshTokenExpiresIn,
        } as jwt.SignOptions
    );
};

export const User = mongoose.model<IUser>("User", UserSchema);
