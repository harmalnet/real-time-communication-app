import dotenv from "dotenv";
dotenv.config();
import server from "./app";
import { initMySQL } from "./db";
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
  console.log("Shutting down real-time-communication-app...");
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

    // Connect to MySQL (Sequelize)
    await initMySQL();
    console.log("✅ MySQL connected (Sequelize)");

    // Start the HTTP server
    server.listen(port, () => {
      console.log(`🚀 real-time-communication-app running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to Redis:", error);
    process.exit(1); // Exit the application if Redis connection fails
  });