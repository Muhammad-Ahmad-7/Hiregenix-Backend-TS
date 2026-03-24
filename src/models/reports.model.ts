import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReport extends Document {
    _id: Types.ObjectId;
    interviewId: Types.ObjectId;

    contentScore: number;
    communicationScore: number;
    fluencyScore: number;
    confidenceScore: number;
    overallScore: number;

    overallAnswerQuality: string;
    overallInterviewScore: number;

    topStrengths?: string[];
    topWeaknesses?: string[];
    commonMissingConcepts?: string[];
    overallImprovementSuggestions?: string[];


    integrityConcern: boolean;
    integrityNotes: string;

    interviewSummary: string;

    createdAt?: Date;
    updatedAt?: Date;
    pdfUrl?: string;
}

const ReportSchema = new Schema<IReport>({
    interviewId: {
        type: Schema.Types.ObjectId,
        ref: "Interview"
    },
    contentScore: {
        type: Number,
        default: null
    },
    communicationScore: {
        type: Number,
        default: null
    },
    fluencyScore: {
        type: Number,
        default: null
    },
    confidenceScore: {
        type: Number,
        default: null
    },
    overallScore: {
        type: Number,
        default: null
    },
    overallAnswerQuality: {
        type: String,
        default: null
    },
    overallInterviewScore: {
        type: Number,
        default: null
    },
    topStrengths: {
        type: [String],
        default: []
    },
    topWeaknesses: {
        type: [String],
        default: []
    },
    commonMissingConcepts: {
        type: [String],
        default: []
    },
    overallImprovementSuggestions: {
        type: [String],
        default: []
    },
    integrityConcern: {
        type: Boolean,
        default: false
    },
    integrityNotes: {
        type: String,
        default: null
    },
    interviewSummary: {
        type: String,
        default: null
    },
    pdfUrl: {
        type: String,
        default: null
    }
}, { timestamps: true });

export const ReportModel = mongoose.model<IReport>("Report", ReportSchema);
