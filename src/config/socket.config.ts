import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { RedisAuth } from "../api/middlewares/authMiddleware";
import {
  setUserSocket,
  removeUserSocket,
  publishChatMessage,
  subscribeToChatMessages,
  subscribeToNotifications,
} from "./redis.config";

let io: Server;

/**
 * Initializes WebSocket server
 * @param server - HTTP server instance
 */
const initSocket = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://sodgygsfrontend.vercel.app/"],
      credentials: true,
    },
  });

  io.on("connection", async (socket: Socket) => {
    console.log(`🔌 New connection: ${socket.id}`);
    const token: string = socket.handshake.auth?.token;
    const userId: string | null = RedisAuth(token); // Implement separately
    console.log("userID:", userId);
    if (userId) {
      await setUserSocket(userId, socket.id);
      console.log(`✅ User ${userId} mapped to socket ${socket.id}`);

      socket.emit("welcome", { message: `Hello, User ${userId}` });
    } else {
      console.warn(
        "⚠️ Connection without a valid token. Disconnecting client."
      );
      socket.disconnect(true); // Disconnect the client
      return;
    }

    // Handle disconnection
    socket.on("disconnect", async () => {
      if (userId) {
        console.log(`❌ User ${userId} disconnected`);
        await removeUserSocket(userId);
      }
    });
    socket.on("sendMessage", async (data) => {
      const { from, to, message, chat_id, senderName } = data;
      console.log("Message data:", data);
      try {
        await publishChatMessage(from, to, message, senderName, chat_id);
        console.debug(`✅ User ${from} sent message to ${to}`);
      } catch (error) {
        console.error(
          `❌ Failed to send message from ${from} to ${to}:`,
          error
        );
      }
    });
    // socket.on("notification", async (data) => {
    //   const { userId, title, content, notificationType } = data;
    //   console.log("Message data:", data);
    //   try {
    //     await publishNotification({userId, title, content, notificationType});
    //     console.debug(`✅ Notification sent to ${userId}`);
    //   } catch (error) {
    //     console.error(
    //       `❌ Failed to send notfication to ${userId}:`,
    //       error
    //     );
    //   }
    // });
  });

  // Subscribe to notifications from Redis
  subscribeToNotifications(io);
  // Subscribe to chat messages from Redis
  subscribeToChatMessages(io);
};

/**
 * Returns the WebSocket instance
 * @returns WebSocket Server instance
 */
const getSocketInstance = (): Server => {
  if (!io) {
    throw new Error(
      "Socket.io has not been initialized. Call `initSocket()` first."
    );
  }
  return io;
};

// Export functions
export { initSocket, getSocketInstance };
