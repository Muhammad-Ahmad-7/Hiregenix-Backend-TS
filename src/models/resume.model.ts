import mongoose, { Document, Schema, Types } from "mongoose";

export interface IResume extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId; // reference to Candidate
    fileUrl?: string;
    parsedData: {
        name?: string;
        email?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        portfolio?: string;
        summary?: string;
        skills?: string[];
        experience?: {
            company?: string;
            position?: string;
            startDate?: Date | null;
            endDate?: Date | null;
            description?: string;
        }[];
        education?: {
            institution?: string;
            degree?: string;
            startYear?: number | null;
            endYear?: number | null;
        }[];
        projects?: {
            name?: string;
            description?: string;
            link?: string;
            technologies?: string[];
        }[];
        certifications?: {
            name?: string;
            issuer?: string;
            year?: number | null;
        }[];
    };
    aiScore?: number;
    aiSuggestions?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

const ResumeSchema = new Schema<IResume>(
    {
        candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
        fileUrl: { type: String, default: null },
        parsedData: {
            name: { type: String, default: null },
            email: { type: String, default: null },
            phone: { type: String, default: null },
            linkedin: { type: String, default: null },
            github: { type: String, default: null },
            portfolio: { type: String, default: null },
            summary: { type: String, default: null },
            skills: { type: [String], default: [] },
            experience: {
                type: [
                    {
                        company: { type: String, default: null },
                        position: { type: String, default: null },
                        startDate: { type: Date, default: null },
                        endDate: { type: Date, default: null },
                        description: { type: String, default: null },
                    },
                ],
                default: [],
            },
            education: {
                type: [
                    {
                        institution: { type: String, default: null },
                        degree: { type: String, default: null },
                        startYear: { type: Number, default: null },
                        endYear: { type: Number, default: null },
                    },
                ],
                default: [],
            },
            projects: {
                type: [
                    {
                        name: { type: String, default: null },
                        description: { type: String, default: null },
                        link: { type: String, default: null },
                        technologies: { type: [String], default: [] },
                    },
                ],
                default: [],
            },
            certifications: {
                type: [
                    {
                        name: { type: String, default: null },
                        issuer: { type: String, default: null },
                        year: { type: Number, default: null },
                    },
                ],
                default: [],
            },
        },
        aiScore: { type: Number, default: null },
        aiSuggestions: { type: [String], default: [] },
    },
    { timestamps: true }
);

export const ResumeModel = mongoose.model<IResume>("Resume", ResumeSchema);
export default ResumeModel;
