import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInterview extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    companyId: Types.ObjectId;
    jobId: Types.ObjectId;
    type: "live" | "mock" | "video";

    scheduledAt?: Date;
    durationMins?: number;

    status:
    | "pending"               // Interview created but not yet scheduled
    | "scheduled"             // Scheduled but not started
    | "in-progress"           // Interview currently happening
    | "completed"             // Interview completed successfully
    | "missed"                // Scheduled but not attended, and job deadline passed
    | "no-show"               // Scheduled but not attended, job still open
    | "cancelled"             // Cancelled manually by candidate/company
    | "expired";              // Job deadline crossed, and interview never scheduled or completed

    recordingUrl?: string;
    transcriptText?: string;
    voiceAnalysis?: any;
    facialAnalysis?: any;

    aiResult?: {
        stars?: number;                // e.g., 1–5 stars rating from AI evaluation
        score?: number;                // e.g., numeric score 0–100
        summary?: string;              // AI-generated summary of performance
        strengths?: string[];          // Key strengths detected
        improvements?: string[];       // Areas to improve
        aiReportUrl?: string;          // Link to full AI report
    };

    finalScore?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const InterviewSchema = new Schema<IInterview>(
    {
        candidateId: {
            type: Schema.Types.ObjectId,
            ref: "Candidate",
            required: true,
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        jobId: {
            type: Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        type: {
            type: String,
            enum: ["live", "mock", "video"],
            default: "live",
        },
        scheduledAt: Date,
        durationMins: Number,
        status: {
            type: String,
            enum: [
                "pending",
                "scheduled",
                "in-progress",
                "completed",
                "missed",
                "no-show",
                "cancelled",
                "expired",
            ],
            default: "pending",
        },
        recordingUrl: String,
        transcriptText: String,
        voiceAnalysis: Schema.Types.Mixed,
        facialAnalysis: Schema.Types.Mixed,
        aiResult: {
            stars: Number,
            score: Number,
            summary: String,
            strengths: [String],
            improvements: [String],
            aiReportUrl: String,
        },
        finalScore: Number,
    },
    { timestamps: true }
);

export const InterviewModel = mongoose.model<IInterview>(
    "Interview",
    InterviewSchema
);
