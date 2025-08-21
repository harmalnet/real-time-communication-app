import { Request, Response } from "express";
import { Room, RoomMember, Message, User } from "../../../db/models";
import { Op } from "sequelize";
import { BadRequest, Forbidden, ResourceNotFound } from "../../../errors/httpErrors";
import { 
  createRoomValidator, 
  joinRoomValidator, 
  sendMessageValidator,
  editMessageValidator,
  roomIdParamValidator,
  messageIdParamValidator,
  paginationQueryValidator
} from "../../../validators/room.validator";

function makeInvite(): string {
  return Math.random().toString(36).slice(2, 10);
}

class RoomController {
  async create(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    
    // Validate request body using validator
    const { error, data } = createRoomValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { name, description, isPrivate } = data;
    const inviteCode = isPrivate ? makeInvite() : undefined;
    
    const room = await Room.create({ 
      name, 
      description, 
      isPrivate: !!isPrivate, 
      inviteCode, 
      createdBy: user.userId 
    });
    
    await RoomMember.create({ 
      roomId: room.id, 
      userId: user.userId, 
      role: "admin" 
    });
    
    return res.created({ room });
  }

  async join(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    
    // Validate request body using validator
    const { error, data } = joinRoomValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { roomId, inviteCode } = data;

    let room = null as Room | null;
    if (roomId) {
      room = await Room.findByPk(roomId);
    } else if (inviteCode) {
      room = await Room.findOne({ where: { inviteCode } });
    }
    
    if (!room) throw new ResourceNotFound("Room not found", "RESOURCE_NOT_FOUND");
    
    if (room.isPrivate && room.inviteCode && inviteCode !== room.inviteCode) {
      throw new Forbidden("Invalid invite code", "ACCESS_DENIED");
    }
    
    await RoomMember.findOrCreate({ 
      where: { roomId: room.id, userId: user.userId }, 
      defaults: { roomId: room.id, userId: user.userId, role: "member" } 
    });
    
    return res.ok({ room });
  }

  async myRooms(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    const memberships = await RoomMember.findAll({ where: { userId: user.userId } });
    const roomIds = memberships.map((m) => m.getDataValue("roomId") as string);
    const rooms = await Room.findAll({ where: { id: { [Op.in]: roomIds } } });
    return res.ok({ rooms });
  }

  async messages(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    const roomId = req.params.roomId;
    
    // Validate room ID parameter
    const roomIdValidation = roomIdParamValidator(roomId);
    if (roomIdValidation.error) throw new BadRequest(roomIdValidation.error.message, roomIdValidation.error.code);

    // Validate query parameters
    const queryValidation = paginationQueryValidator(req.query);
    if (queryValidation.error) throw new BadRequest(queryValidation.error.message, queryValidation.error.code);

    const { page, limit } = queryValidation.data;
    const offset = (page - 1) * limit;

    const membership = await RoomMember.findOne({ where: { roomId, userId: user.userId } });
    if (!membership) throw new Forbidden("Not a member of this room", "ACCESS_DENIED");

    const messages = await Message.findAll({
      where: { roomId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "fullName"]
        }
      ]
    });
    
    return res.ok({ messages, pagination: { page, limit, total: messages.length } });
  }

  async sendMessage(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    
    // Validate request body using validator
    const { error, data } = sendMessageValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { roomId, content } = data;

    // Check if user is a member of the room
    const membership = await RoomMember.findOne({ where: { roomId, userId: user.userId } });
    if (!membership) throw new Forbidden("Not a member of this room", "ACCESS_DENIED");

    // Create the message
    const message = await Message.create({
      roomId,
      senderId: user.userId,
      content,
      deliveredAt: new Date()
    });

    return res.created({ message });
  }

  async editMessage(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    const messageId = req.params.messageId;
    
    // Validate message ID parameter
    const messageIdValidation = messageIdParamValidator(messageId);
    if (messageIdValidation.error) throw new BadRequest(messageIdValidation.error.message, messageIdValidation.error.code);

    // Validate request body
    const { error, data } = editMessageValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { content } = data;

    // Find the message and check ownership
    const message = await Message.findByPk(messageId);
    if (!message) throw new ResourceNotFound("Message not found", "RESOURCE_NOT_FOUND");
    
    if (message.senderId !== user.userId) {
      throw new Forbidden("You can only edit your own messages", "ACCESS_DENIED");
    }

    // Update the message
    await message.update({
      content: content.trim(),
      isEdited: true,
      editedAt: new Date()
    });

    return res.ok({ message });
  }

  async deleteMessage(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    const messageId = req.params.messageId;
    
    // Validate message ID parameter
    const messageIdValidation = messageIdParamValidator(messageId);
    if (messageIdValidation.error) throw new BadRequest(messageIdValidation.error.message, messageIdValidation.error.code);

    // Find the message and check ownership or admin status
    const message = await Message.findByPk(messageId);
    if (!message) throw new ResourceNotFound("Message not found", "RESOURCE_NOT_FOUND");

    // Check if user is a member of the room
    const membership = await RoomMember.findOne({ 
      where: { roomId: message.roomId, userId: user.userId } 
    });
    if (!membership) throw new Forbidden("Not a member of this room", "ACCESS_DENIED");
    
    if (message.senderId !== user.userId && membership.role !== "admin") {
      throw new Forbidden("You can only delete your own messages or must be an admin", "ACCESS_DENIED");
    }

    // Delete the message
    await message.destroy();

    return res.ok({ message: "Message deleted successfully" });
  }

  async markMessageAsRead(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    const messageId = req.params.messageId;
    
    // Validate message ID parameter
    const messageIdValidation = messageIdParamValidator(messageId);
    if (messageIdValidation.error) throw new BadRequest(messageIdValidation.error.message, messageIdValidation.error.code);

    // Find the message and check if user is in the room
    const message = await Message.findByPk(messageId, {
      include: [
        {
          model: Room,
          as: "room"
        }
      ]
    });

    if (!message) throw new ResourceNotFound("Message not found", "RESOURCE_NOT_FOUND");
    
    const membership = await RoomMember.findOne({ 
      where: { roomId: message.roomId, userId: user.userId } 
    });
    if (!membership) throw new Forbidden("Not a member of this room", "ACCESS_DENIED");

    // Mark message as read
    await message.update({
      readAt: new Date()
    });

    return res.ok({ message: "Message marked as read" });
  }

  async getRoomInfo(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    const roomId = req.params.roomId;
    
    // Validate room ID parameter
    const roomIdValidation = roomIdParamValidator(roomId);
    if (roomIdValidation.error) throw new BadRequest(roomIdValidation.error.message, roomIdValidation.error.code);

    // Check if user is a member of the room
    const membership = await RoomMember.findOne({ where: { roomId, userId: user.userId } });
    if (!membership) throw new Forbidden("Not a member of this room", "ACCESS_DENIED");

    // Get room information with member count
    const room = await Room.findByPk(roomId, {
      include: [
        {
          model: RoomMember,
          as: "memberships",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "fullName", "isOnline", "lastSeen"]
            }
          ]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "fullName"]
        }
      ]
    });

    if (!room) throw new ResourceNotFound("Room not found", "RESOURCE_NOT_FOUND");

    return res.ok({ room });
  }

  async leaveRoom(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    const roomId = req.params.roomId;
    
    // Validate room ID parameter
    const roomIdValidation = roomIdParamValidator(roomId);
    if (roomIdValidation.error) throw new BadRequest(roomIdValidation.error.message, roomIdValidation.error.code);

    // Check if user is a member of the room
    const membership = await RoomMember.findOne({ where: { roomId, userId: user.userId } });
    if (!membership) throw new Forbidden("Not a member of this room", "ACCESS_DENIED");

    // Check if user is the creator (admin) and there are other members
    if (membership.role === "admin") {
      const memberCount = await RoomMember.count({ where: { roomId } });
      if (memberCount > 1) {
        throw new BadRequest("Cannot leave room as admin when other members exist. Transfer ownership first.", "INVALID_REQUEST_PARAMETERS");
      }
    }

    // Remove user from room
    await membership.destroy();

    return res.ok({ message: "Successfully left the room" });
  }
}

export default new RoomController();
