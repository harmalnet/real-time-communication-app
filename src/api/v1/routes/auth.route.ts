import { Router } from "express";
import chatAuthController from "../controllers/auth.controller";
import { apiRateLimit } from "../../middlewares/rateLimitMiddleware";
import { AuthMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/register", apiRateLimit, chatAuthController.register);
router.post("/login", apiRateLimit, chatAuthController.login);
router.post("/logout", AuthMiddleware, chatAuthController.logout);
router.get("/profile", AuthMiddleware, chatAuthController.getProfile);

export default router;
