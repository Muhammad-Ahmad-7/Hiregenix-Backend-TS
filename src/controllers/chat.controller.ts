import type { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { CandidateModel } from "../models/candidate.model.js";
import { CompanyModel } from "../models/company.model.js";
import { IChat } from "../types/chat.interface.js";
import { Message } from "../models/message.model.js";

// ===================================================
// GET ALL CHATS FOR LOGGED-IN USER
// ===================================================
const getChats = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user._id;

  // ==========================================
  // 1️⃣ Get All Chats With Populated lastMessageId
  // ==========================================
  const chats = await Chat.find({
    "participants.userId": currentUserId,
  })
    .populate({
      path: "participants.userId",
      select: "email role",
    })
    .populate({
      path: "lastMessageId",
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  // ==========================================
  // 2️⃣ Update All "sent" Messages → "delivered"
  // ==========================================
  const chatIds = chats.map((chat: any) => chat._id);
  let user = await CompanyModel.findOne({ userId: { _id: currentUserId } });
  if (!user) {
    user = await CandidateModel.findOne({ userId: { _id: currentUserId } });
  }

  console.log("i am current user=", currentUserId);
  console.log("is this sender=", user?._id);
  await Message.updateMany(
    {
      chat: { $in: chatIds },
      sender: { $ne: user?._id },
      status: "sent",
    },
    { $set: { status: "delivered" } },
  );

  // ==========================================
  // 3️⃣ Format Chats Properly
  // ==========================================
  const formattedChats = await Promise.all(
    chats.map(async (chat: any) => {
      const otherParticipantData = chat.participants.find(
        (p: any) => p.userId._id.toString() !== currentUserId.toString(),
      );

      if (!otherParticipantData) return null;

      let participantProfile = null;

      // Fetch profile depending on role
      if (otherParticipantData.userType === "candidate") {
        participantProfile = await CandidateModel.findOne({
          userId: otherParticipantData.userId._id,
        })
          .select("fullName profilePictureUrl")
          .lean();
      } else if (otherParticipantData.userType === "company") {
        participantProfile = await CompanyModel.findOne({
          userId: otherParticipantData.userId._id,
        })
          .select("companyName logoUrl")
          .lean();
      }

      const participant = {
        _id: otherParticipantData.userId._id,
        email: otherParticipantData.userId.email,
        role: otherParticipantData.userId.role,
        ...(otherParticipantData.userType === "candidate"
          ? {
              fullName: participantProfile?.fullName,
              profilePictureUrl: participantProfile?.profilePictureUrl,
            }
          : {
              companyName: participantProfile?.companyName,
              logoUrl: participantProfile?.logoUrl,
            }),
      };

      return {
        _id: chat._id,
        participant,
        participantType: otherParticipantData.userType,

        // 🔥 Structured Last Message
        lastMessage: chat.lastMessageId,
        // ? {
        //     _id: chat.lastMessageId._id,
        //     text: chat.lastMessageId.text,
        //     sender: chat.lastMessageId.sender,
        //     createdAt: chat.lastMessageId.createdAt,
        //   }
        // : null,

        unReadCount: chat.unReadCount,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    }),
  );

  const validChats = formattedChats.filter(Boolean);

  return responseHelper(res, 200, "Success", "All chats fetched successfully", {
    data: {
      chats: validChats,
    },
  });
});

// ===================================================
// GET OR CREATE CHAT WITH SPECIFIC PARTICIPANT
// ===================================================
const getOrCreateChat = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user._id;
  const participantId = req.params.participantId;

  // Validate participant ID
  if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
    return res.status(400).json({ message: "Invalid participant id" });
  }

  // Prevent self-chat
  if (currentUserId.toString() === participantId) {
    return res.status(400).json({ message: "You cannot chat with yourself" });
  }

  // Fetch roles of both users
  const [currentUser, participantUser] = await Promise.all([
    User.findById(currentUserId).select("role email"),
    User.findById(participantId).select("role email"),
  ]);

  // Check if users exist
  if (!currentUser || !participantUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // Role-based chat rules
  const isValidPairing =
    (currentUser.role === "candidate" && participantUser.role === "company") ||
    (currentUser.role === "company" && participantUser.role === "candidate");

  if (!isValidPairing) {
    return res.status(403).json({
      message: "Candidates can only chat with companies and vice versa",
    });
  }

  // Check if chat already exists
  let chat = await Chat.findOne({
    "participants.userId": { $all: [currentUserId, participantId] },
  })
    .populate({
      path: "participants.userId",
      select: "email role",
    })
    .populate({
      path: "lastMessage",
      select: "text sender createdAt",
    })
    .lean();
  console.log("hloboy:", chat);
  let isNewChat = false;

  // If chat doesn't exist, create it
  if (!chat) {
    isNewChat = true;

    const newChat = await Chat.create({
      participants: [
        {
          userId: currentUserId, // ⭐ Store User ID
          userType: currentUser.role, // ⭐ 'candidate' or 'company'
        },
        {
          userId: participantId, // ⭐ Store User ID
          userType: participantUser.role, // ⭐ 'candidate' or 'company'
        },
      ],
    });

    chat = await Chat.findById(newChat._id)
      .populate({
        path: "participants.userId",
        select: "email role",
      })
      .populate({
        path: "lastMessage",
        select: "text sender createdAt",
      })
      .lean();
  }

  if (!chat) {
    return res
      .status(500)
      .json({ message: "Failed to create or retrieve chat" });
  }

  // Find the other participant
  const otherParticipantData = (chat as any).participants.find(
    (p: any) => p.userId._id.toString() !== currentUserId.toString(),
  );

  let participantProfile = null;

  // Fetch Candidate or Company profile
  if (otherParticipantData.userType === "candidate") {
    participantProfile = await CandidateModel.findOne({
      userId: otherParticipantData.userId._id,
    })
      .select("fullName profilePictureUrl")
      .lean();
  } else if (otherParticipantData.userType === "company") {
    participantProfile = await CompanyModel.findOne({
      userId: otherParticipantData.userId._id,
    })
      .select("companyName logoUrl")
      .lean();
  }

  // Combine user and profile data
  const participant = {
    _id: otherParticipantData.userId._id,
    email: otherParticipantData.userId.email,
    role: otherParticipantData.userId.role,
    ...(otherParticipantData.userType === "candidate"
      ? {
          fullName: participantProfile?.fullName,
          profilePictureUrl: participantProfile?.profilePictureUrl,
        }
      : {
          companyName: participantProfile?.companyName,
          logoUrl: participantProfile?.logoUrl,
        }),
  };

  const formattedChat = {
    _id: (chat as any)._id,
    participant,
    participantType: otherParticipantData.userType,
    lastMessage: (chat as any).lastMessage,
    lastMessageAt: (chat as any).lastMessageAt,

    unReadCount: (chat as any).unReadCount,
    createdAt: (chat as any).createdAt,
    updatedAt: (chat as any).updatedAt,
  };

  return responseHelper(
    res,
    isNewChat ? 201 : 200,
    "Success",
    isNewChat ? "Chat created successfully" : "Chat retrieved successfully",
    {
      data: {
        chat: formattedChat,
      },
    },
  );
});

export { getChats, getOrCreateChat };
