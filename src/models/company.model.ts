import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICompany extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId,
    companyName: string;
    logoUrl?: string;
    website?: string;
    location?: {
        city?: string;
        country?: string
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const CompanySchema = new Schema<ICompany>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    companyName: { type: String, required: true },
    logoUrl: String,
    website: String,
    location: {
        city: String,
        country: String
    }
}, { timestamps: true });

export const CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
export default CompanyModel;