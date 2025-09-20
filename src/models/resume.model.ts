import mongoose, { Document, Schema, Types } from "mongoose";

export interface IResume extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId; // reference to Candidate
    fileUrl?: string; // uploaded resume file (S3, GCS, etc.)
    parsedData: {
        name?: string;
        email?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        portfolio?: string;
        summary?: string; // extracted bio/summary
        skills?: string[];
        experience?: {
            company: string;
            position: string;
            startDate?: Date;
            endDate?: Date | null;
            description?: string;
        }[];
        education?: {
            institution: string;
            degree: string;
            startYear?: number;
            endYear?: number;
        }[];
        projects?: {
            name: string;
            description?: string;
            link?: string;
            technologies?: string[];
        }[];
        certifications?: {
            name: string;
            issuer?: string;
            year?: number;
        }[];
    };
    aiScore?: number; // AI-driven resume score
    aiSuggestions?: string[]; // AI-generated suggestions for improvement
    createdAt?: Date;
    updatedAt?: Date;
}

const ResumeSchema = new Schema<IResume>(
    {
        candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
        fileUrl: String,
        parsedData: {
            name: String,
            email: String,
            phone: String,
            linkedin: String,
            github: String,
            portfolio: String,
            summary: String,
            skills: [String],
            experience: [
                {
                    company: String,
                    position: String,
                    startDate: Date,
                    endDate: Date,
                    description: String,
                },
            ],
            education: [
                {
                    institution: String,
                    degree: String,
                    startYear: Number,
                    endYear: Number,
                },
            ],
            projects: [
                {
                    name: String,
                    description: String,
                    link: String,
                    technologies: [String],
                },
            ],
            certifications: [
                {
                    name: String,
                    issuer: String,
                    year: Number,
                },
            ],
        },
        aiScore: Number,
        aiSuggestions: [String],
    },
    { timestamps: true }
);

export const ResumeModel = mongoose.model<IResume>("Resume", ResumeSchema);
export default ResumeModel;
