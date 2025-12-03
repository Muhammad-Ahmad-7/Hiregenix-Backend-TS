import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISavedJob extends Document {
    jobId: Types.ObjectId;
    candidateId: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}


const SavedJobSchema = new Schema<ISavedJob>({
    jobId: {
        type: Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    candidateId: {
        type: Schema.Types.ObjectId,
        ref: "Candidate",
        required: true
    }
}, { timestamps: true });


export const SavedJobModel = mongoose.model<ISavedJob>("SavedJob", SavedJobSchema);