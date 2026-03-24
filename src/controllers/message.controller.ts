import type { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";
import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { CandidateModel } from "../models/candidate.model.js";
import { CompanyModel } from "../models/company.model.js";
import { IMessage } from "../types/chat.interface.js";

// ===================================================
// GET ALL MESSAGES FOR A SPECIFIC CHAT
// ===================================================
const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user._id;
  console.log("current user:", req.user);
  const chatId = req.params.chatId;
  let user = await CompanyModel.findOne({
    userId: currentUserId,
  });
  if (!user || !user._id) {
    const candidate = await CandidateModel.findOne({
      userId: currentUserId,
    });
    user = candidate;
    //TO-DO: return response of no user
    if (!user || !user._id) return;
  }
  console.log(user._id);
  // Validate chat ID
  if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat id" });
  }

  // Verify that the chat exists and user is a participant
  const chat = await Chat.findById(chatId).lean();

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  // Check if current user is a participant
  const isParticipant = (chat as any).participants.some(
    (p: any) => p.userId.toString() === currentUserId.toString(),
  );

  if (!isParticipant) {
    return res
      .status(403)
      .json({ message: "You are not a participant in this chat" });
  }

  // Get pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  console.log(
    "underworld:",
    new mongoose.Types.ObjectId(Number(currentUserId)),
  );
  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: user._id },
      status: { $in: ["sent", "delivered"] }, // only update sent messages
    },
    { $set: { status: "seen" } },
  );
  // Fetch messages with pagination
  const [messages, totalMessages] = await Promise.all([
    Message.find({ chat: chatId })
      .populate("replyingTo")
      .sort({ createdAt: -1 }) // newest first
      .limit(limit)
      .skip(skip),
    Message.countDocuments({ chat: chatId }),
  ]);
  const msgs = messages.reverse();

  return responseHelper(
    res,
    200,
    "Success",
    "Messages fetched successfully",
    {
      data: {
        messages: msgs,
      },
    },
    {
      page,
      limit,
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      hasMore: page * limit < totalMessages,
    },
  );
});
const getMessages2 = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user._id;
  console.log("current user:", req.user);
  const chatId = req.params.chatId;
  let user = await CompanyModel.findOne({
    userId: currentUserId,
  });
  if (!user || !user._id) {
    const candidate = await CandidateModel.findOne({
      userId: currentUserId,
    });
    user = candidate;
    //TO-DO: return response of no user
    if (!user || !user._id) return;
  }
  console.log(user._id);
  // Validate chat ID
  if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat id" });
  }

  // Verify that the chat exists and user is a participant
  const chat = await Chat.findById(chatId).lean();

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  // Check if current user is a participant
  const isParticipant = (chat as any).participants.some(
    (p: any) => p.userId.toString() === currentUserId.toString(),
  );

  if (!isParticipant) {
    return res
      .status(403)
      .json({ message: "You are not a participant in this chat" });
  }

  // Get pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  console.log(
    "underworld:",
    new mongoose.Types.ObjectId(Number(currentUserId)),
  );
  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: user._id },
      status: { $in: ["sent", "delivered"] }, // only update sent messages
    },
    { $set: { status: "seen" } },
  );
  // Fetch messages with pagination
  const [messages, totalMessages] = await Promise.all([
    Message.find({ chat: chatId })
      .populate("replyingTo")
      .sort({ createdAt: -1 }) // newest first
      .limit(limit)
      .skip(skip),
    Message.countDocuments({ chat: chatId }),
  ]);
  const msgs = messages.reverse();
  const groupedMessages = msgs.reduce((acc: any, message: IMessage) => {
    const date = new Date(message.createdAt).toISOString().split("T")[0];
    // format: YYYY-MM-DD

    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push(message);
    return acc;
  }, {});
  return responseHelper(
    res,
    200,
    "Success",
    "Messages fetched successfully",
    {
      data: {
        messages: groupedMessages,
      },
    },
    {
      page,
      limit,
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      hasMore: page * limit < totalMessages,
    },
  );
});

export { getMessages, getMessages2 };
