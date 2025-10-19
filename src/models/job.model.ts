import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJob extends Document {
    companyId: Types.ObjectId;
    title: string;
    role: string;
    interviewGuideline: string;
    experienceLevel: "entry" | "mid" | "senior";
    description: string;
    requiredSkills: string[];
    workMode: "full-time" | "part-time" | "remote";
    deadline: Date;
    aiSummary?: string;
    embeddingSynced?: boolean;
    qdrantId?: string;
    requirements?: string[];
    location?: {
        city?: string;
        country?: string;
    };
    salaryRange?: {
        min?: number;
        max?: number;
        currency?: string
    };
    isDeleted?: boolean;
    status?: "open" | "closed";
    createdAt?: Date;
    updatedAt?: Date;
}

const JobSchema = new Schema<IJob>({
    companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    interviewGuideline: {
        type: String,
        required: true
    },
    experienceLevel: {
        type: String,
        enum: ["entry", "mid", "senior"],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requiredSkills: {
        type: [String],
        required: true
    },
    requirements: {
        type: [String],
        required: false
    },
    workMode: {
        type: String,
        enum: ["full-time", "part-time", "remote"],
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    salaryRange: {
        min: Number,
        max: Number,
        currency: String
    },
    aiSummary: { // using llm to generate the summary of job for vectorization.
        type: String,
        default: "",
    },
    embeddingSynced: {
        type: Boolean,
        default: false,
    },
    qdrantId: {
        type: String,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["open", "closed"],
        default: "open"
    },
}, { timestamps: true });

export const JobModel = mongoose.model<IJob>("Job", JobSchema);
