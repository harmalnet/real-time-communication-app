import cors from "cors";
import express from "express";
import morgan from "morgan";
import { createServer } from "http";

import * as errorMiddlewares from "./api/middlewares/errorMiddlewares";
import responseUtilities from "./api/middlewares/responseUtilities";
import v1Router from "./api/v1/routes";

const app = express();
const server = createServer(app); // Wrap Express in an HTTP server

const whitelist = ["http://localhost:3000", "http://localhost:3002"];

// Middlewares
app.use(responseUtilities);
app.use(cors({ origin: whitelist, exposedHeaders: ["X-API-TOKEN"] }));

app.use(morgan("dev"));

// API Routes
app.use("/api/v1", v1Router);

// Error middlewares
app.use(errorMiddlewares.errorLogger);
app.use(errorMiddlewares.errorHandler);

// 404 Handler
app.use((req, res) => {
  res
    .status(404)
    .json({ error: "Resource not found", code: "UNKNOWN_ENDPOINT" });
});

// Export the HTTP server and app
export default server;
