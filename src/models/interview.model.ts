import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInterview extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    companyId: Types.ObjectId;
    jobId: Types.ObjectId;
    type: "live";

    scheduledDate?: Date;
    durationMins?: number;

    status:
    | "pending"              // Interview created but not yet scheduled
    | "scheduled"            // Scheduled but not started
    | "notified"             // Notification sent to candidate
    | "in-progress"          // Interview currently happening
    | "completed"            // Interview completed successfully
    | "missed"               // Scheduled but not attended, and job deadline passed
    | "no-show"              // Scheduled but not attended, job still open
    | "cancelled"            // Cancelled manually by candidate/company
    | "expired"              // Job deadline crossed, and interview never scheduled or completed
    | "rejected"             // Interview rejected after completion or during review
    | "hired"                // Candidate hired after successful interview       
    | "ended";               // Interview ended by the candidate
    questions: string[];
    totalQuestions: number;
    completedQuestions: number;
    livenessVideoUrl: string;
    livenessCheckPassed: boolean;
    faceCaptureImageUrl: string;
    faceCaptureEmbeddings: number[];
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
            default: "live",
        },
        scheduledDate: Date,
        durationMins: Number,
        status: {
            type: String,
            enum: [
                "pending",
                "scheduled",
                "notified",
                "in-progress",
                "completed",
                "missed",
                "no-show",
                "cancelled",
                "expired",
                "rejected",
                "hired",
                "ended",
            ],
            default: "pending",
        },
        questions: {
            type: [String],
            default: [
                "Tell me about a recent challenge you solved.",
                "What's something you failed at recently?",
                "How do you handle tight deadlines?",
                "Describe a time you disagreed with a teammate.",
                "How do you prioritize your work?",
                "How do you approach a completely new problem?",
                "What do you do when you're stuck?",
                "How do you break down complex tasks?",
                "How do you decide between multiple solutions?",
                "What does ownership mean to you?",
            ],
        },
        totalQuestions: {
            type: Number,
            default: 10,
        },
        completedQuestions: {
            type: Number,
            default: 0,
        },
        livenessVideoUrl: {
            type: String,
            default: null,
        },
        livenessCheckPassed: {
            type: Boolean,
            default: false,
        },
        faceCaptureImageUrl: {
            type: String,
            default: null,
        },
        faceCaptureEmbeddings: {
            type: [Number],
            default: null,
        },
    },
    { timestamps: true }
);

export const InterviewModel = mongoose.model<IInterview>(
    "Interview",
    InterviewSchema
);
