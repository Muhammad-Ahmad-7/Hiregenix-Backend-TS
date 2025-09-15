import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICompany extends Document {
    _id: Types.ObjectId;
    companyName: string;
    email: string;
    passwordHash?: string;
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
    companyName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    passwordHash: String,
    logoUrl: String,
    website: String,
    location: { 
        city: String, 
        country: String 
    }
}, { timestamps: true });

export const CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
export default CompanyModel;