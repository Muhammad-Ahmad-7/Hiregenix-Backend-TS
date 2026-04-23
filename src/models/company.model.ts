import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICompany extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId,
    companyName: string;
    logoUrl?: string;
    website?: string;
    linkedInUrl?: string;
    city?: string;
    country?: string;
    foundedYear?: number;
    description?: string;
    techStack?: string[];
    contactEmail?: string;
    isVerified: boolean;
    hiringStatus: "actively_hiring" | "paused" | "not_hiring";
    ntnNumber: string;
    isDeleted?: string;
    isProfileCompleted: boolean;
    knowledgeBasePdfUrl?: string | null;
    knowledgeBaseQdrantCollection?: string | null;
    knowledgeBaseUpdatedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const CompanySchema = new Schema<ICompany>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    companyName: {
        type: String,
        default: null,
        unique: true
    },
    logoUrl: {
        type: String,
        default: null
    },
    website: {
        type: String,
        default: null,
    },
    city: {
        type: String,
        default: null
    },
    country: {
        type: String,
        default: null
    },
    foundedYear: {
        type: Number,
        default: null,
        min: [1900, 'Founded year must be after 1900'],
        max: [new Date().getFullYear(), 'Founded year cannot be in the future']
    },
    description: {
        type: String,
        default: null,
    },
    contactEmail: {
        type: String,
        default: null,
    },
    linkedInUrl: {
        type: String,
        default: null,
    },
    techStack: {
        type: [String],
        default: null,
        set: (values: string[]) => values.map(v => v.toLowerCase())
    },
    isVerified: { type: Boolean, default: false },
    hiringStatus: {
        type: String,
        enum: ["actively_hiring", "paused", "not_hiring"],
        default: "actively_hiring"
    },
    ntnNumber: {
        type: String,
        default: null,
        unique: true
    },
    isDeleted: {
        type: String,
        default: false,
    },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
    knowledgeBasePdfUrl: {
        type: String,
        default: null,
    },
    knowledgeBaseQdrantCollection: {
        type: String,
        default: null,
    },
    knowledgeBaseUpdatedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
export default CompanyModel;