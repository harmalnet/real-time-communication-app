import dotenv from "dotenv";
dotenv.config();
import server from "./app";
import connectDB from "./db";
import "./env";
import { startJobs } from "./config/agenda.config";
import { initSocket } from "./config/socket.config";
import { connectRedis, disconnectRedis } from "./config/redis.config";

process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await disconnectRedis(); // Disconnect Redis
  server.close(); // Close the HTTP server
  process.exit(0);
});


const port = process.env.PORT || "8080";
connectRedis()
  .then(async () => {
    console.log("✅ Redis connected successfully.");

    // Initialize WebSocket after Redis is connected
    initSocket(server);

    // Connect to MongoDB
    await connectDB();
    console.log("Successfully connected to MongoDB");

    // Start Agenda jobs
    await startJobs();
    console.log("Agenda started successfully");

    // Start the HTTP server
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to Redis:", error);
    process.exit(1); // Exit the application if Redis connection fails
  });