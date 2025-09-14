// src/models/candidate.model.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICandidate extends Document {
    _id: Types.ObjectId;
    email: string;
    name: string;
    phone?: string;
    authProvider?: "local" | "google" | "linkedin";
    passwordHash?: string;
    profilePictureUrl?: string;
    headline?: string;
    location?: { 
        city?: string; 
        country?: string; 
        remote?: boolean 
    };
    resumeId?: Types.ObjectId; // link to resume doc
    skills: string[];
    experience: {
        company?: string;
        position?: string;
        startDate?: Date;
        endDate?: Date | null;
        description?: string;
    }[];
    education: {
        institution?: string;
        degree?: string;
        startYear?: number;
        endYear?: number;
    }[];
    embeddings?: number[]; // optional profile embedding
    appliedJobs?: Types.ObjectId[]; // job ids
    interviews?: Types.ObjectId[];  // interview ids
    createdAt?: Date;
    updatedAt?: Date;
}

const CandidateSchema = new Schema<ICandidate>({
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: { 
        type: String, 
        required: true 
    },
    phone: {
        type: String,
        required: true,
        Unique: true
    },
    authProvider: { 
        type: String, 
        enum: ["local", "google", "linkedin"], 
        default: "local" 
    },
    passwordHash: String,
    profilePictureUrl: String,
    headline: String,
    location: { 
        city: String, 
        country: String, 
        remote: Boolean 
    },
    resumeId: {
        type: Schema.Types.ObjectId,
        ref: "Resume" 
    },
    skills: {
        type: [String], 
        default: [] 
    },
    experience: { 
        type: [{
            company: String, 
            position: String, 
            startDate: Date, 
            endDate: Date, 
            description: String 
        }], 
        default: [] 
    },
    education: { 
        type: [{ 
            institution: String, 
            degree: String, 
            startYear: Number, 
            endYear: Number 
        }], 
        default: [] 
    },
    embeddings: { 
        type: [Number], 
        default: undefined 
    }, // vector
    appliedJobs: [{ 
        type: Schema.Types.ObjectId, 
        ref: "Job" 
    }],
    interviews: [{ 
        type: Schema.Types.ObjectId, 
        ref: "Interview" 
    }]
}, { timestamps: true });

export const CandidateModel = mongoose.model<ICandidate>("Candidate", CandidateSchema);
export default CandidateModel;
