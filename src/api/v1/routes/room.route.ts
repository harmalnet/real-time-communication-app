import { Router } from "express";
import roomController from "../controllers/room.controller";
import { apiRateLimit, messageRateLimit } from "../../middlewares/rateLimitMiddleware";
import { AuthMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

// Room management
router.post("/", AuthMiddleware, apiRateLimit, roomController.create);
router.post("/:roomId/join", AuthMiddleware, apiRateLimit, roomController.join);
router.get("/", AuthMiddleware, roomController.myRooms);
router.get("/:roomId", AuthMiddleware, roomController.getRoomInfo);
router.delete("/:roomId/leave", AuthMiddleware, apiRateLimit, roomController.leaveRoom);

// Messages
router.get("/:roomId/messages", AuthMiddleware, roomController.messages);
router.post("/:roomId/messages", AuthMiddleware, messageRateLimit, roomController.sendMessage);
router.put("/:roomId/messages/:messageId", AuthMiddleware, messageRateLimit, roomController.editMessage);
router.delete("/:roomId/messages/:messageId", AuthMiddleware, apiRateLimit, roomController.deleteMessage);
router.patch("/:roomId/messages/:messageId/read", AuthMiddleware, apiRateLimit, roomController.markMessageAsRead);

export default router;
