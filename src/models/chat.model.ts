import mongoose, { Schema, Document } from "mongoose";
import { IChat } from "../types/chat.interface.js";

const ChatSchema = new Schema<IChat>(
  {
    participants: [
      {
        _id: false,
        userId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "User",
        },
        userType: {
          type: String,
          required: true,
          enum: ["candidate", "company"], // ⭐ Use lowercase to match user roles
        },
      },
    ],
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessage: {
      // type: Schema.Types.ObjectId,
      // ref: "Message",

      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unReadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Add indexes
ChatSchema.index({ "participants.userId": 1 });
ChatSchema.index({ lastMessageAt: -1 });

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);
