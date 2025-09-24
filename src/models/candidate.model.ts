import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICandidate extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId,
    fullName?: string;
    phone?: string;
    profilePictureUrl?: string;
    headline?: string;
    location?: { city?: string; country?: string; remote?: boolean };
    resumeId?: Types.ObjectId; // quick link to resume
    skills: string[];
    isProfileCompleted: boolean,
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
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    fullName: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    profilePictureUrl: {
        type: String,
        default: null
    },
    headline: {
        type: String,
        default: null
    },
    location: {
        city: {
            type: String,
            default: null
        },
        country: {
            type: String,
            default: null
        },
        remote: {
            type: Boolean,
            default: false
        }
    },
    resumeId: {
        type: Schema.Types.ObjectId,
        ref: "Resume"
    },
    skills: { type: [String], default: [] },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
    experience: [{
        company: {
            type: String,
            default: null
        },
        position: {
            type: String,
            default: null
        },
        startDate: {
            type: Date,
            default: null
        },
        endDate: {
            type: Date,
            default: null
        },
        description: {
            type: String,
            default: null
        }
    }],
    education: [{
        institution: {
            type: String,
            default: null
        },
        degree: {
            type: String,
            default: null
        },
        startYear: {
            type: Number,
            default: null
        },
        endYear: {
            type: Number,
            default: null
        }
    }]
}, { timestamps: true });

export const CandidateModel = mongoose.model<ICandidate>("Candidate", CandidateSchema);
export default CandidateModel;
