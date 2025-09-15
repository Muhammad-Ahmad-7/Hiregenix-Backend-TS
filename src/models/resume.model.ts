import mongoose, { Schema, Document, Types } from "mongoose";

export interface IResume extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    fileUrl: string;
    parsed?: {
        summary?: string;
        skills?: string[];
        experience?: any[];
        education?: any[];
    };
    embeddings?: number[];
    createdAt?: Date;
    updatedAt?: Date;
}

const ResumeSchema = new Schema<IResume>({
    candidateId: { 
        type: Schema.Types.ObjectId, 
        ref: "Candidate", 
        required: true, 
        index: true 
    },
    fileUrl: { 
        type: String, 
        required: true 
    },
    parsed: { 
        summary: String, 
        skills: [String], 
        experience: [Schema.Types.Mixed], 
        education: [Schema.Types.Mixed] 
    },
    embeddings: { 
        type: [Number], 
        default: undefined 
    }
}, { timestamps: true });

export const ResumeModel = mongoose.model<IResume>("Resume", ResumeSchema);
