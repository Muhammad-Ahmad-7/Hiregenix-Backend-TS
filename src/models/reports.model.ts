import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReport extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    companyId: Types.ObjectId;
    jobId: Types.ObjectId;
    interviewId: Types.ObjectId;
    cvMatchPercent?: number;
    interviewScore?: number;
    voiceScore?: number;
    facialScore?: number;
    overallScore?: number;
    summary?: string;
    pdfUrl?: string;
}

const ReportSchema = new Schema<IReport>({
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
        ref: "Job" 
    },
    interviewId: { 
        type: Schema.Types.ObjectId, 
        ref: "Interview" 
    },
    cvMatchPercent: Number,
    interviewScore: Number,
    voiceScore: Number,
    facialScore: Number,
    overallScore: Number,
    summary: String,
    pdfUrl: String
}, { timestamps: true });

export const ReportModel = mongoose.model<IReport>("Report", ReportSchema);
