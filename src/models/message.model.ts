import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types/chat.interface.js";

const MessageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"], // ✅ correct
      default: "sent",
      required: true,
    },
    reaction: {
      type: String,
      default: null,
    },
    replyingTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true },
);

// Index for fast chat pagination
MessageSchema.index({ chat: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
