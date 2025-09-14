import mongoose, { Schema, Document, Types } from "mongoose";

export interface IApplication extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    jobId: Types.ObjectId;
    appliedAt: Date;
    status: "applied" | "shortlisted" | "rejected" | "hired";
}

const ApplicationSchema = new Schema<IApplication>({
    candidateId: { 
        type: Schema.Types.ObjectId, 
        ref: "Candidate", 
        required: true 
    },
    jobId: { 
        type: Schema.Types.ObjectId, 
        ref: "Job", 
        required: true 
    },
    appliedAt: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ["applied", "shortlisted", "rejected", "hired"], 
        default: "applied" 
    }
}, { timestamps: true });

export const ApplicationModel = mongoose.model<IApplication>("Application", ApplicationSchema);
