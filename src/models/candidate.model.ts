import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICandidate extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId,
    fullName?: string;
    dateOfBirth: Date;
    gender: "male" | "female" | "other";
    contactNumber?: string;
    profilePictureUrl?: string;
    bio?: string;
    city?: string;
    country?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    resumeId?: Types.ObjectId; // quick link to resume
    skills: string[];
    isProfileCompleted: boolean,
    tagline?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const CandidateSchema = new Schema<ICandidate>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    fullName: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: null
    },
    country: {
        type: String,
        default: null
    },
    city: {
        type: String,
        default: null
    },
    contactNumber: {
        type: String,
        unique: true,
        default: null
    },
    profilePictureUrl: {
        type: String,
        default: null
    },
    githubUrl: {
        type: String,
        default: null
    },
    linkedinUrl: {
        type: String,
        default: null
    },
    portfolioUrl: {
        type: String,
        default: null
    },
    skills: { type: [String], default: [] },
    bio: {
        type: String,
        default: null
    },
    tagline: {
        type: String,
        default: null
    },
    resumeId: {
        type: Schema.Types.ObjectId,
        ref: "Resume",
        default: null,
    },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export const CandidateModel = mongoose.model<ICandidate>("Candidate", CandidateSchema);
export default CandidateModel;
