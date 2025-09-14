import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInterview extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    companyId: Types.ObjectId;
    jobId: Types.ObjectId;
    type: "live" | "mock" | "video";
    scheduledAt?: Date;
    durationMins?: number;
    status: "scheduled" | "completed" | "cancelled";
    recordingUrl?: string;
    transcriptText?: string;
    voiceAnalysis?: any;
    facialAnalysis?: any;
    finalScore?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const InterviewSchema = new Schema<IInterview>({
    candidateId: { 
        type: Schema.Types.ObjectId,
        ref: "Candidate", 
        required: true 
    },
    companyId: { 
        type: Schema.Types.ObjectId, 
        ref: "Company", 
        required: true 
    },
    jobId: { 
        type: Schema.Types.ObjectId, 
        ref: "Job", 
        required: true 
    },
    type: { 
        type: String, 
        enum: ["live", "mock", "video"], 
        default: "live" 
    },
    scheduledAt: Date,
    durationMins: Number,
    status: { 
        type: String, 
        enum: ["scheduled", "completed", "cancelled"], 
        default: "scheduled" 
    },
    recordingUrl: String,
    transcriptText: String,
    voiceAnalysis: Schema.Types.Mixed,
    facialAnalysis: Schema.Types.Mixed,
    finalScore: Number
}, { timestamps: true });

export const InterviewModel = mongoose.model<IInterview>("Interview", InterviewSchema);
