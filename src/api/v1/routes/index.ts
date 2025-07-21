import express from "express";

import controller from "../controllers";
import sharedRouter from "../../shared/routes";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import adminRouter from "./admin.route";
import webhookRouter from "./webhook.route";
import blogRouter from "./blog.route";
import transactionRouter from "./transaction.route";
import notificationRouter from "./notification.route";
import contactRouter from "./contactus.route";
import locationRouter from "./location.route";

const router = express.Router();

// Welcome endpoint
router.get("/", controller.welcomeHandler);
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/admins", adminRouter);
router.use("/blogs", blogRouter);
router.use("/webhooks", webhookRouter);
router.use("/transactions", transactionRouter);
router.use("/notifications", notificationRouter);
router.use("/contactus", contactRouter);
router.use("/locations", locationRouter);

router.use("/", sharedRouter);

export default router;
