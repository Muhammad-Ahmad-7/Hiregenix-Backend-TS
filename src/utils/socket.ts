import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";

import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { User } from "../models/user.model.js";

// store online users in memory: userId -> socketId
export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    config.frontend.url!,
  ].filter(Boolean) as string[];

  const io = new SocketServer(httpServer, {
    cors: { origin: allowedOrigins },
    pingInterval: 10000, // 10s
    pingTimeout: 5000, // 5s
  });

  // verify socket connection - if the user is authenticated, we will store the user id in the socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log("token from sockets:", token);

      if (!token) {
        return next(new Error("Unauthorized: No token provided"));
      }

      const decodeToken: any = jwt.verify(token, config.jwt.accessTokenSecret);

      if (!decodeToken || !decodeToken._id) {
        return next(new Error("Unauthorized: Invalid token"));
      }

      const user = await User.findById(decodeToken._id).select("-password");

      if (!user) {
        return next(new Error("Unauthorized: User not found"));
      }

      socket.data.user = user;

      socket.data.userId = decodeToken._id.toString();

      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  const reactionMap = new Map();
  io.on("connection", async (socket) => {
    socket.onAny((event, ...args) => {
      console.log("📩 Received:", event, args);
    });
    const userId = socket.data.userId;
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    socket.broadcast.emit("iAmOnline", userId);

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.data.userId);

      socket.broadcast.emit("iAmOffline", socket.data.userId);
    });
    socket.on("updateMessageStatus", async (data) => {
      const { messageId, status, chatId, sender, toUser, allunjun } = data;
      const isUserOnline = onlineUsers.get(toUser);
      io.to(chatId).emit("updateMessageStatus", {
        messageId,
        status,
        chatId,
        sender,
        isUserOnline,
      });
      await Message.findOneAndUpdate(
        {
          _id: messageId,
          status: { $ne: "seen" }, // only update if NOT already seen
        },
        {
          $set: { status },
        },
      );
    });

    socket.on(
      "private-chat",
      async ({ selectedChat, userId, selectedChatP }) => {
        const lastMessageSenderId =
          selectedChatP?.lastMessage?.sender?.toString?.() ??
          selectedChatP?.lastMessage?.sender ??
          null;

        // New chats can have null lastMessage; only mark as seen when
        // there is an actual last message from the other participant.
        if (lastMessageSenderId && lastMessageSenderId !== userId) {
          const onNew = await Chat.findByIdAndUpdate(
            selectedChat,

            { unReadCount: 0 },
            { new: true },
          );
          const onNew2 = await Message.updateMany(
            { chat: selectedChat, sender: { $ne: userId } },
            {
              status: "seen",
            },
          );
          //
          io.to(selectedChat).emit("updateAllMessagesStatusToSeen", {
            selectedChat,
          });
          console.log("trailer", onNew);

          console.log("trailer2", onNew2);
        }

        socket.join(selectedChat);
      },
    );
    socket.on("uploadingFile", ({ selectedChat }) => {
      io.to(selectedChat).emit("uploadingFile");
    });
    socket.on("uploadedFileDone", ({ selectedChat }) => {
      io.to(selectedChat).emit("uploadedFileDone");
    });
    socket.on("sendMessage", async (data) => {
      let { chatId, msgId, sender, msg, toUser, replyingTo } = data;

      const isUserOnline = onlineUsers.get(toUser); // returns socketId or undefined

      console.log(data);
      const created = new Message({
        chat: data.chatId,
        text: data.msg,
        sender: data.sender,
        replyingTo,
      });
      msgId = (created._id as any).toString();
      const room = io.sockets.adapter.rooms.get(chatId);
      if (isUserOnline)
        if (room && room.has(isUserOnline)) {
          console.log("Socket is in room ✅");
        } else {
          console.log("Socket is NOT in room ❌");
        }

      if (isUserOnline && room && !room.has(isUserOnline)) {
        io.to(toUser).emit("sendMessage", {
          chatId,
          msgId,
          sender,
          msg,
          isUserOnline,
          replyingTo: replyingTo ?? null,
        });
      }

      io.to(chatId).emit("sendMessage", {
        chatId,
        msgId,
        sender,
        msg,
        isUserOnline,
        replyingTo: replyingTo ?? null,
      });
      console.log(data);
      io.emit("updateLastMessage", data);
      console.log("yooo", (created._id as any).toString());
      reactionMap.set(data.msgId, (created._id as any).toString());
      console.log("reactionMap", reactionMap);
      const newCreated = await created.save();
      if (isUserOnline) {
        const onNew = await Chat.findByIdAndUpdate(
          chatId,
          { $inc: { unReadCount: 1 } },
          { new: true },
        );

        console.log("idontknow", onNew);
      }
      const updated = await Chat.findByIdAndUpdate(data.chatId, {
        lastMessageId: (newCreated._id as any).toString(),
        lastMessage: data.msg,
      });
      console.log("createdmsg", created);

      console.log("updatedmsg", updated);
    });
    socket.on("updateReaction", async ({ messageId, reaction }) => {
      console.log("backedn", messageId, reaction);

      socket.broadcast.emit("updateReaction", { messageId, reaction });
      console.log(reactionMap);
      let mongoId = reactionMap.get(messageId);
      if (mongoId === undefined) {
        mongoId = messageId;
      }
      console.log("mongoid", mongoId);
      const updatedStatus = await Message.findByIdAndUpdate(mongoId, {
        reaction: reaction,
      });
      console.log("---", updatedStatus);
    });
  });

  return io;
};
