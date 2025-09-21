import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITask extends Document {
    userId: Types.ObjectId;
    type: "resume_parsing" | "profile_enhancement" | "resume_feedback" | "interview_prep";
    payload: Record<string, any>;  // flexible
    status: "pending" | "processing" | "completed" | "failed";
    result?: Record<string, any>;
    error?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["resume_parsing", "profile_enhancement", "resume_feedback", "interview_prep"],
            required: true,
        },
        payload: { type: Schema.Types.Mixed, required: true }, // flexible JSON
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },
        result: { type: Schema.Types.Mixed },
        error: { type: String, default: null },
    },
    { timestamps: true }
);

export const TaskModel = mongoose.model<ITask>("Task", TaskSchema);
