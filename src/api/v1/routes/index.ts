import express from "express";

import roomRouter from "./room.route";
import authRouter from "./auth.route";

const router = express.Router();

// Welcome endpoint
router.get("/", (_req, res) => {
  res.json({ name: "real-time-communication-app", status: "ok" });
});

router.use("/auth", authRouter);
router.use("/rooms", roomRouter);

export default router;
