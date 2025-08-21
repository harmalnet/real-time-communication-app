import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Message, Room, RoomMember, User } from "../db/models";
import {
  setUserSocket,
  removeUserSocket,
  subscribeToChatMessages,
} from "./redis.config";
import {
  joinRoomEventValidator,
  typingEventValidator,
  sendMessageEventValidator,
  editMessageEventValidator,
  deleteMessageEventValidator,
  markMessageReadEventValidator,
} from "../validators/socket.validator";

let io: Server;

/**
 * Initializes WebSocket server
 * @param server - HTTP server instance
 */
const initSocket = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3002"],
      credentials: true,
    },
  });

  io.on("connection", async (socket: Socket) => {
    console.log(`🔌 New connection: ${socket.id}`);
    const token: string | undefined = socket.handshake.auth?.token;
    if (!token) {
      console.warn("⚠️ Connection without token. Disconnecting.");
      socket.disconnect(true);
      return;
    }
    let userId: string | null = null;
    try {
      const payload = jwt.verify(token, process.env.JWT_SEC as string) as { userId: string };
      userId = payload.userId;
    } catch {
      console.warn("⚠️ Invalid token. Disconnecting client.");
      socket.disconnect(true);
      return;
    }
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

    // Presence: broadcast user_status online
    io.emit("user_status", { userId, status: "online" });

    // Basic per-socket rate limiter: max 5 messages/10s
    const rateWindowMs = 10_000;
    const maxMsgs = 5;
    let msgTimestamps: number[] = [];

    // Join room event
    socket.on("join_room", async (data: any) => {
      try {
        // Validate incoming data
        const validation = joinRoomEventValidator(data);
        if (validation.error) {
          return socket.emit("error", { message: validation.error.message });
        }

        const { roomId } = validation.data;
        const member = await RoomMember.findOne({ where: { roomId, userId } });
        if (!member) {
          return socket.emit("error", { message: "Not a member of this room" });
        }
        const room = await Room.findByPk(roomId);
        if (!room) return socket.emit("error", { message: "Room not found" });
        const roomKey = `room-${roomId}`;
        socket.join(roomKey);
        io.to(roomKey).emit("user_status", { userId, status: "joined", roomId });
      } catch (e) {
        console.error(e);
        socket.emit("error", { message: "Internal server error" });
      }
    });

    // Typing indicator
    socket.on("typing", (data: any) => {
      try {
        // Validate incoming data
        const validation = typingEventValidator(data);
        if (validation.error) {
          return socket.emit("error", { message: validation.error.message });
        }

        const { roomId, isTyping } = validation.data;
        const roomKey = `room-${roomId}`;
        io.to(roomKey).emit("typing", { userId, roomId, isTyping });
      } catch (e) {
        console.error(e);
        socket.emit("error", { message: "Internal server error" });
      }
    });

    // Send message to room
    socket.on("send_message", async (data: any) => {
      try {
        // Validate incoming data
        const validation = sendMessageEventValidator(data);
        if (validation.error) {
          return socket.emit("error", { message: validation.error.message });
        }

        const { roomId, content } = validation.data;

        // Rate limit
        const now = Date.now();
        msgTimestamps = msgTimestamps.filter((t) => now - t < rateWindowMs);
        if (msgTimestamps.length >= maxMsgs) {
          return socket.emit("error", { message: "Rate limit exceeded" });
        }
        msgTimestamps.push(now);

        // Access control
        const member = await RoomMember.findOne({ where: { roomId, userId } });
        if (!member) return socket.emit("error", { message: "Not a member of this room" });

        // Persist message
        const msg = await Message.create({ roomId, senderId: userId, content: content.trim(), deliveredAt: new Date() });
        const payload = {
          id: msg.getDataValue("id"),
          roomId,
          senderId: userId,
          content: content.trim(),
          createdAt: msg.getDataValue("createdAt"),
          deliveredAt: msg.getDataValue("deliveredAt"),
        };
        const roomKey = `room-${roomId}`;
        io.to(roomKey).emit("receive_message", payload);
      } catch (e) {
        console.error("send_message error", e);
        socket.emit("error", { message: "Unable to send message" });
      }
    });

    // Edit message event
    socket.on("edit_message", async (data: any) => {
      try {
        // Validate incoming data
        const validation = editMessageEventValidator(data);
        if (validation.error) {
          return socket.emit("error", { message: validation.error.message });
        }

        const { messageId, content } = validation.data;

        // Find the message and check ownership
        const message = await Message.findByPk(messageId);
        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }

        if (message.senderId !== userId) {
          return socket.emit("error", { message: "You can only edit your own messages" });
        }

        // Update the message
        await message.update({
          content: content.trim(),
          isEdited: true,
          editedAt: new Date()
        });

        const payload = {
          id: message.id,
          roomId: message.roomId,
          content: message.content,
          isEdited: true,
          editedAt: message.editedAt,
          updatedAt: message.updatedAt
        };

        const roomKey = `room-${message.roomId}`;
        io.to(roomKey).emit("message_edited", payload);
      } catch (e) {
        console.error("edit_message error", e);
        socket.emit("error", { message: "Unable to edit message" });
      }
    });

    // Delete message event
    socket.on("delete_message", async (data: any) => {
      try {
        // Validate incoming data
        const validation = deleteMessageEventValidator(data);
        if (validation.error) {
          return socket.emit("error", { message: validation.error.message });
        }

        const { messageId } = validation.data;

        // Find the message and check ownership or admin status
        const message = await Message.findByPk(messageId);
        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }

        // Check if user is a member of the room
        const membership = await RoomMember.findOne({ 
          where: { roomId: message.roomId, userId } 
        });
        if (!membership) {
          return socket.emit("error", { message: "Not a member of this room" });
        }

        if (message.senderId !== userId && membership.role !== "admin") {
          return socket.emit("error", { message: "You can only delete your own messages or must be an admin" });
        }

        const roomId = message.roomId;
        
        // Delete the message
        await message.destroy();

        const roomKey = `room-${message.roomId}`;
        io.to(roomKey).emit("message_deleted", { messageId, roomId });
      } catch (e) {
        console.error("delete_message error", e);
        socket.emit("error", { message: "Unable to delete message" });
      }
    });

    // Mark message as read event
    socket.on("mark_message_read", async (data: any) => {
      try {
        // Validate incoming data
        const validation = markMessageReadEventValidator(data);
        if (validation.error) {
          return socket.emit("error", { message: validation.error.message });
        }

        const { messageId } = validation.data;

        // Find the message and check if user is in the room
        const message = await Message.findByPk(messageId);
        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }

        // Check if user is a member of the room
        const membership = await RoomMember.findOne({ 
          where: { roomId: message.roomId, userId } 
        });
        if (!membership) {
          return socket.emit("error", { message: "Not a member of this room" });
        }

        // Mark message as read
        await message.update({
          readAt: new Date()
        });

        const payload = {
          messageId,
          roomId: message.roomId,
          readAt: message.readAt,
          readBy: userId
        };

        const roomKey = `room-${message.roomId}`;
        io.to(roomKey).emit("message_read", payload);
      } catch (e) {
        console.error("mark_message_read error", e);
        socket.emit("error", { message: "Unable to mark message as read" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      if (userId) {
        console.log(`❌ User ${userId} disconnected`);
        await removeUserSocket(String(userId));
        await User.update({ lastSeen: new Date() }, { where: { id: userId } });
        io.emit("user_status", { userId, status: "offline", lastSeen: new Date().toISOString() });
      }
    });
  });

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
