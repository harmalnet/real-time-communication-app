import { createClient } from "redis";
import { Server } from "socket.io";
import chatController from "../api/v1/controllers/chat.controller";
import {
  INotification,
  NotificationType,
} from "../db/models/notification.model";
import { sanitizeParticipants } from "../utils/chatHelper";
import notificationController from "../api/v1/controllers/notification.controller";

// Create Redis clients
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

// Connect to Redis
const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    await pubClient.connect();
    await subClient.connect();

    // Add event listeners for Redis errors
    redisClient.on("error", (err) =>
      console.error("❌ Redis client error:", err)
    );
    pubClient.on("error", (err) => console.error("❌ Pub client error:", err));
    subClient.on("error", (err) => console.error("❌ Sub client error:", err));

    console.log("✅ Redis connected...");
  } catch (error) {
    console.error("❌ Redis connection error:", error);
    throw error; // Re-throw the error to handle it upstream if needed
  }
};

// Disconnect Redis clients
const disconnectRedis = async (): Promise<void> => {
  try {
    await Promise.all([redisClient.quit(), pubClient.quit(), subClient.quit()]);
    console.log("✅ Redis disconnected...");
  } catch (error) {
    console.error("❌ Redis disconnection error:", error);
  }
};

// Store user socket ID in Redis
const setUserSocket = async (
  userId: string,
  socketId: string
): Promise<void> => {
  try {
    await redisClient.set(`socket:${userId}`, socketId);
    console.debug(`✅ Set socket ID for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to set socket ID for user ${userId}:`, error);
    throw error;
  }
};

// Get user socket ID from Redis
const getUserSocket = async (userId: string): Promise<string | null> => {
  try {
    const socketId = await redisClient.get(`socket:${userId}`);
    console.debug(`✅ Retrieved socket ID for user ${userId}:`, socketId);
    return socketId;
  } catch (error) {
    console.error(`❌ Failed to retrieve socket ID for user ${userId}:`, error);
    return null;
  }
};

// get batch of user socket IDs from Redis
const getBatchUserSockets = async (
  userIdsStr: string // this should be a JSON stringified array of participants
): Promise<Record<string, string | null>> => {
  const rawArray = JSON.parse(userIdsStr); // parse back to array
  const participants = sanitizeParticipants(rawArray);
  const socketIds = await Promise.all(
    participants.map((user) => {
      const userId = user._id;
      if (!userId) return Promise.resolve(null);
      return redisClient.get(`socket:${userId}`);
    })
  );

  const result: Record<string, string | null> = {};
  participants.forEach((user, index) => {
    if (user._id) result[user._id] = socketIds[index];
  });

  console.debug("✅ Retrieved batch of socket IDs for users", result);
  return result;
};

// Remove user socket ID from Redis
const removeUserSocket = async (userId: string): Promise<void> => {
  try {
    await redisClient.del(`socket:${userId}`);
    console.debug(`✅ Removed socket ID for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to remove socket ID for user ${userId}:`, error);
    throw error;
  }
};

// Publish notification
const publishNotification = async ({
  userId,
  title,
  content,
  notificationType,
}: INotification): Promise<void> => {
  try {
    await pubClient.publish(
      "notifications",
      JSON.stringify({
        userId,
        content,
        title,
        notificationType,
      })
    );
    console.debug(`✅ Published notification for user ${userId}`);
  } catch (error) {
    console.error(
      `❌ Failed to publish notification for user ${userId}:`,
      error
    );
    throw error;
  }
};

// Subscribe to notifications
const subscribeToNotifications = (io: Server): void => {
  subClient.subscribe("notifications", async (message: string) => {
    try {
      const { userId, title, content, notificationType } = JSON.parse(message);

      // Fetch the socket ID for the user
      const socketId = await getUserSocket(userId);

      if (socketId) {
        io.to(socketId).emit("notification", {
          recipientId: userId,
          title,
          notificationType: notificationType,
          createdAt: new Date(),
          content,
          isRead: false,
        });
        await notificationController.createNotification(message);
        console.debug(`✅ Sent notification to user ${userId}`);
      } else {
        await notificationController.createNotification(message);
        console.warn(`⚠️ No active socket found for user ${userId}`);
      }
    } catch (error) {
      console.error("❌ Error processing notification:", error);
    }
  });

  // Handle subscription errors
  subClient.on("message", (channel, message) => {
    if (channel === "notifications") {
      console.debug(`Received message on channel "${channel}":`, message);
    }
  });
};

const publishChatMessage = async (
  senderId: string,
  recipientId: string,
  message: string,
  senderName: string, // Name of the sender for notifications
  chat_id?: string // Optional chat ID for future use
): Promise<void> => {
  try {
    await pubClient.publish(
      "chat", // Use a dedicated Redis channel for chat
      JSON.stringify({
        senderId,
        recipientId,
        content: message,
        chat_id, // Include chat ID if available
        senderName,
        isRead: false,
        createdAt: new Date(),
      })
    );
    console.debug(
      `✅ Published chat message from ${senderId} to ${recipientId}`
    );
  } catch (error) {
    console.error(
      `❌ Failed to publish chat message from ${senderId} to ${recipientId}:`,
      error
    );
    throw error;
  }
};

const subscribeToChatMessages = (io: Server): void => {
  subClient.subscribe("chat", async (data: string) => {
    try {
      const {
        senderId,
        recipientId,
        content,
        isRead,
        createdAt,
        chat_id,
        senderName,
      } = JSON.parse(data);
      // Fetch the socket ID of the recipient
      const senderSocketId = await getUserSocket(senderId);
      const recipientSocketId = await getUserSocket(recipientId);
      const message = {
        userId: recipientId,
        title: "New Message Received from " + senderName,
        notificationType: NotificationType.NEW_MESSAGE.toString(),
        content: content,
        chat_id,
        isRead: false,
        createdAt: new Date(),
      };
      if (senderSocketId) {
        io.to(senderSocketId).emit("updateChatList", {
          user: recipientId,
          lastMessage: content,
          timestamp: new Date(),
          OnlineStatus: !!recipientSocketId,
        });
        io.to(senderSocketId).emit("sentMessage", {
          sender: senderId,
          content,
          isRead: false,
          createdAt,
        });
      }
      if (recipientSocketId) {
        // Send the message to the recipient via WebSocket
        io.to(recipientSocketId).emit("updateChatList", {
          user: senderId,
          lastMessage: content,
          timestamp: new Date(),
          onlineStatus: true,
        });
        io.to(recipientSocketId).emit("receiveMessage", {
          sender: senderId,
          content,
          isRead,
          createdAt,
        });

        io.to(recipientSocketId).emit("notification", message);
        // await publishNotification({
        //   userId: recipientId,
        //   title: "New Message",
        //   content,
        //   notificationType: NotificationType.NEW_MESSAGE,
        // });
        console.debug(
          `✅ Sent chat message from ${senderId} to ${recipientId}`
        );
      } else {
        console.warn(
          `⚠️ Recipient ${recipientId} is offline. Message not delivered.`
        );
      }
      await chatController.sendMessage(senderId, recipientId, content);
      await notificationController.createNotification(JSON.stringify(message));
    } catch (error) {
      console.error("❌ Error processing chat message:", error);
    }
  });

  // Debugging: Log all messages received on the "chat" channel
  subClient.on("message", (channel, message) => {
    if (channel === "chat") {
      console.debug(`Received chat message on channel "${channel}":`, message);
    }
  });
};

// Export functions
export {
  connectRedis,
  disconnectRedis,
  setUserSocket,
  getUserSocket,
  getBatchUserSockets,
  removeUserSocket,
  publishChatMessage,
  subscribeToChatMessages,
  publishNotification,
  subscribeToNotifications,
};
