import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICandidate extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId,
    phone?: string;
    profilePictureUrl?: string;
    headline?: string;
    location?: { city?: string; country?: string; remote?: boolean };
    resumeId?: Types.ObjectId; // quick link to resume
    skills: string[];
    experience: {
        company: string;
        position: string;
        startDate: Date;
        endDate?: Date | null;
        description?: string;
    }[];
    education: {
        institution: string;
        degree: string;
        startYear: number;
        endYear: number;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

const CandidateSchema = new Schema<ICandidate>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    phone: String,
    profilePictureUrl: String,
    headline: String,
    location: { city: String, country: String, remote: Boolean },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume" },
    skills: { type: [String], default: [] },
    experience: [{
        company: String,
        position: String,
        startDate: Date,
        endDate: Date,
        description: String
    }],
    education: [{
        institution: String,
        degree: String,
        startYear: Number,
        endYear: Number
    }]
}, { timestamps: true });

export const CandidateModel = mongoose.model<ICandidate>("Candidate", CandidateSchema);
export default CandidateModel;
