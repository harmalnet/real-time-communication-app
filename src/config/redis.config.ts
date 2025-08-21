import { createClient } from "redis";
import { Server } from "socket.io";
import { chatMessageValidator } from "../validators/redis.validator";

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

const publishChatMessage = async (
  senderId: string,
  recipientId: string,
  message: string,
  senderName: string, // Name of the sender for notifications
  chat_id?: string // Optional chat ID for future use
): Promise<void> => {
  try {
    const messageData = {
      senderId,
      recipientId,
      content: message,
      chat_id, // Include chat ID if available
      senderName,
      isRead: false,
      createdAt: new Date(),
    };

    // Validate message data before publishing
    const validation = chatMessageValidator(messageData);
    if (validation.error) {
      throw new Error(`Invalid message data: ${validation.error.message}`);
    }

    await pubClient.publish(
      "chat", // Use a dedicated Redis channel for chat
      JSON.stringify(validation.data)
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
      const parsedData = JSON.parse(data);
      
      // Validate incoming message data
      const validation = chatMessageValidator(parsedData);
      if (validation.error) {
        console.error("❌ Invalid chat message format:", validation.error.message);
        return;
      }

      const {
        senderId,
        recipientId,
        content,
        isRead,
        createdAt,
      } = validation.data;

      // Fetch the socket ID of the recipient
      const senderSocketId = await getUserSocket(senderId);
      const recipientSocketId = await getUserSocket(recipientId);
      
      // Minimal message payload for client updates
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

        console.debug(
          `✅ Sent chat message from ${senderId} to ${recipientId}`
        );
      } else {
        console.warn(
          `⚠️ Recipient ${recipientId} is offline. Message not delivered.`
        );
      }
      // Persistence is handled elsewhere (SQL models in socket handlers)
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
  removeUserSocket,
  publishChatMessage,
  subscribeToChatMessages,
  redisClient,
};
