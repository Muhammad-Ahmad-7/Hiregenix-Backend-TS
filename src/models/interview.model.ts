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
    | "pending"               // Interview created but not yet scheduled
    | "scheduled"             // Scheduled but not started
    | "notified"              // Notification sent to candidate
    | "in-progress"           // Interview currently happening
    | "completed"             // Interview completed successfully
    | "missed"                // Scheduled but not attended, and job deadline passed
    | "no-show"               // Scheduled but not attended, job still open
    | "cancelled"             // Cancelled manually by candidate/company
    | "expired";              // Job deadline crossed, and interview never scheduled or completed
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
            ],
            default: "pending",
        },
        questions: {
            type: [String],
            // TODO: This one needs to be changed
            default: [
                "Define 'Idempotency' in the context of HTTP methods and why it matters for API design.",
                "What is a deadlock in a database, and how can a developer prevent one from occurring.",
                "Explain the concept of 'Horizontal Scaling' versus 'Vertical Scaling' for a server.",
                "What is the purpose of a Message Queue like RabbitMQ or Kafka in a distributed system?",
                "What is a 'Rate Limiter' and why is it important for public-facing APIs?",
            ],
        },
        totalQuestions: {
            type: Number,
            default: 5, // TODO: This one needs to be changed
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
