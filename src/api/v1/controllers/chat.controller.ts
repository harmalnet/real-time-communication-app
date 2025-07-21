/* eslint-disable no-constant-condition */
import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import {
  // BadRequest,
  // Forbidden,
  ResourceNotFound,
} from "../../../errors/httpErrors";
import Chat from "../../../db/models/chat.model";
// import Bid from "../../../db/models/bid.model";
// import Task from "../../../db/models/tasks.model";

// import * as validators from "../validators/chat.validator";
import _ from "lodash";

import { getLimit, getPage } from "../../../utils/dataFilters";
import { getBatchUserSockets } from "../../../config/redis.config";
import { sanitizeParticipant } from "../../../utils/chatHelper";

type QueryParams = {
  startDate?: Date;
  endDate?: Date;
  limit?: string;
  page?: string;
};

class ChatController {
  async createChat(
    // req: Request, res: Response
  ) {
    // const user_id = req.loggedInAccount._id;

    // // Validate request body
    // const { error, data } = validators.createChatValidator(req.body);
    // if (error) throw new BadRequest(error.message, error.code);

    // // Check if the bid exists
    // const BidExists = await Bid.findOne({ _id: data.bid_id });
    // if (!BidExists)
    //   throw new ResourceNotFound(
    //     "Bid not found for this task",
    //     "RESOURCE_NOT_FOUND"
    //   );
    // const taskExists = await Task.findOne({
    //   _id: BidExists.task_id,
    // });
    // if (!taskExists) {
    //   throw new ResourceNotFound("Task not found", "RESOURCE_NOT_FOUND");
    // }
    // if (
    //   taskExists.serviceProvider_id !== user_id.toString() &&
    //   taskExists.client_id !== user_id.toString()
    // ) {
    //   throw new Forbidden(
    //     "Cannot start Chat for this task",
    //     "INSUFFICIENT_PERMISSIONS"
    //   );
    // }
    // let chatExists;
    // chatExists = await Chat.findOne({
    //   participants: { $all: [taskExists.client_id, BidExists.serviceProvider_id] },
    // });
    // if (!chatExists) {
    //   chatExists = await new Chat({
    //     task_id: BidExists.task_id,
    //     participants: [taskExists.client_id, BidExists.serviceProvider_id],
    //     messages: data.messages,
    //   }).save();
    // }

    // res.ok({
    //   success: "chat started",
    //   data: chatExists,
    // });
  }
  async getChat(req: Request, res: Response) {
    const user_id = req.loggedInAccount._id;
    const { chat_id } = req.query;

    // Check if the chat exists
    const chatExists = await Chat.findOne({
      _id: chat_id,
      participants: user_id,
    }).populate("participants", [
      "_id",
      "firstName",
      "lastName",
      "email",
      "userCustomId",
      "profilePicture",
      "isVerified",
      "phoneNumber",
      "country",
      "city",
      "address",
      "identity",
      "profession",
      "billing",
      "portfolio",
      "certification",
      "rating",
    ]);
    if (!chatExists)
      throw new ResourceNotFound(
        "Chat not found for this task",
        "RESOURCE_NOT_FOUND"
      );

    //   set all messages to read and if no readAt set it to now
    chatExists.messages.forEach((message) => {
      if (message.sender.toString() !== user_id.toString() && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
      }
    });

    await chatExists.save();

    // Sort messages by createdAt (ascending)
    const sortedMessages = _.sortBy(chatExists.messages, "createdAt");

    res.ok({
      success: "chat found",
      chat: { ...chatExists.toObject(), messages: sortedMessages },
    });
  }
  async getAllChats(req: Request, res: Response) {
    const user_id = req.loggedInAccount._id;
    const queryParams: QueryParams = req.query;
    const limit = Math.min(getLimit(queryParams.limit) || 10, 100);
    const page = Math.max(getPage(queryParams.page) || 1, 1);

    // Fetch all chats for the user
    const chats = await Chat.find({
      participants: user_id,
    })
      .populate({
        path: "participants",
        select: "firstName lastName profilePicture",
        match: { _id: { $ne: user_id } },
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ updatedAt: -1 });

    // const userChats = chats.populate({
    //   path: "participants",
    //   select: "firstName lastName profilePicture",
    //   match: {
    //     _id: { $ne: user_id },
    //   },
    // });
    // Batch fetch online statuses
    const userIds = chats
      .map((chat) =>
        chat.participants
          .find((p) => p.toString() !== user_id.toString())
          ?.toString()
      )
      .filter((id) => typeof id === "string") as string[];
    const userIdsAsString = JSON.stringify(userIds);

    const onlineStatusMap = await getBatchUserSockets(userIdsAsString); // Assume this function exists

    // Add metadata to each chat

    const chatsWithMetadata = await Promise.all(
      chats.map((chat) => {
        const unknownUser = chat.participants.find(
          (participant) => participant.toString() !== user_id.toString()
        );
        if (!unknownUser) return null;
        const userInfo = sanitizeParticipant(JSON.stringify(unknownUser));
        if (!userInfo._id) return null;
        const onlineStatus = !!onlineStatusMap[userInfo._id.toString()];
        const lastMessage = chat.messages[chat.messages.length - 1];
        const unreadCount = chat.messages.filter(
          (message) => message.isRead === false && message.sender !== user_id
        ).length;

        return {
          user: unknownUser,
          chat_id: chat._id,
          lastMessage,
          unreadCount,
          onlineStatus,
        };
      })
    );

    res.ok({
      success: "chats found",
      chats: chatsWithMetadata.filter(Boolean), // Remove null entries
    });
  }
  async sendMessage(senderId: string, recipientId: string, message: string) {
    // Check if the chat exists
    const chatExists = await Chat.findOne({
      participants: { $all: [senderId, recipientId] },
    });
    if (!chatExists)
      throw new ResourceNotFound(
        "Chat not found for this task",
        "RESOURCE_NOT_FOUND"
      );
    const newMessage = {
      sender: senderId,
      content: message,
      createdAt: new Date(),
      isRead: false, // Initially, the message is not read
    };

    // Update the chat with the new message
    chatExists.messages.push(newMessage);
    chatExists.updatedAt = new Date(); // Update the updatedAt field
    chatExists.messages = _.sortBy(chatExists.messages, "createdAt"); // Sort messages by createdAt (ascending)
    await chatExists.save();

    return {
      success: "Message sent successfully",
    }
  }
}

export default new ChatController();
