import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJob extends Document {
    _id: Types.ObjectId;
    companyId: Types.ObjectId;
    title: string;
    originalDescription: string;
    aiEnhancedDescription?: string;
    requirements?: string[];
    location?: { 
        city?: string; 
        remote?: boolean 
    };
    salaryRange?: { 
        min?: number; 
        max?: number; 
        currency?: string 
    };
    deadline?: Date;
    status?: "open" | "closed";
    embeddings?: number[];
    createdAt?: Date;
    updatedAt?: Date;
}

const JobSchema = new Schema<IJob>({
    companyId: { 
        type: Schema.Types.ObjectId, 
        ref: "Company", 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    originalDescription: { 
        type: String, 
        required: true 
    },
    aiEnhancedDescription: String,
    requirements: [String],
    location: { 
        city: String, 
        remote: Boolean 
    },
    salaryRange: { 
        min: Number, 
        max: Number, 
        currency: String 
    },
    deadline: Date,
    status: { 
        type: String, 
        enum: ["open", "closed"], 
        default: "open" 
    },
    embeddings: { 
        type: [Number], 
        default: undefined 
    }
}, { timestamps: true });

export const JobModel = mongoose.model<IJob>("Job", JobSchema);
