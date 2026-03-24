import mongoose, { type Document } from "mongoose";
export type IMessageStatus = "sent" | "delivered" | "seen";
export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  status: IMessageStatus;
  reaction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageStatus = "sent" | "delivered" | "seen";

export interface IChatParticipant {
  id: mongoose.Types.ObjectId; // reference to Candidate or Company
  type: "Candidate" | "Company"; // model name for refPath
}

// Chat interface
export interface IChat extends Document {
  participants: IChatParticipant[]; // array of participants
  lastMessage?: string; // optional last message
  lastMessageId?: mongoose.Types.ObjectId;
  lastMessageAt?: Date; // optional last message timestamp
  unReadCount?: number;
  createdAt: Date; // from timestamps
  updatedAt: Date; // from timestamps
}
