import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRecommendedJobs extends Document {
    candidateId: Types.ObjectId;
    recommendedJobs: {
        jobId: string;
        title: string;
        role: string;
        companyName: string;
        companyLogo: string;
        workMode: string;
        aiSummary: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

const RecommendedJobsSchema = new Schema<IRecommendedJobs>(
    {
        candidateId: {
            type: Schema.Types.ObjectId,
            ref: "Candidate",
            required: true,
            unique: true,
        },
        recommendedJobs: [
            {
                jobId: {
                    type: String,
                    required: true,
                },
                title: {
                    type: String,
                    required: true,
                },

                role: {
                    type: String,
                    required: true,
                },
                companyName: {
                    type: String,
                    required: true,
                },
                companyLogo: {
                    type: String,
                    required: true,
                },
                workMode: {
                    type: String,
                    required: true,
                },

                aiSummary: {
                    type: String,
                    default: "",
                },

                createdAt: {
                    type: Date,
                    default: Date.now()
                },

                updatedAt: {
                    type: Date,
                    default: Date.now()
                },
            },
        ],
    },
    { timestamps: true }
);

export const RecommendedJobModel = mongoose.model<IRecommendedJobs>(
    "RecommendedJob",
    RecommendedJobsSchema
);
