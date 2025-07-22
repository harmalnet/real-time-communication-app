import cors from "cors";
import express from "express";
import morgan from "morgan";
import passport from "passport";
import session from "express-session";
import { createServer } from "http";

import * as errorMiddlewares from "./api/middlewares/errorMiddlewares";
import responseUtilities from "./api/middlewares/responseUtilities";
import v1Router from "./api/v1/routes";
import { conditionalMiddleware } from "./utils/expressHelpers";
import GoogleService from "./utils/authGoogleHelpers";

const app = express();
const server = createServer(app); // Wrap Express in an HTTP server

const whitelist = [
  "http://localhost:3002",
  "https://crownlist-staging.vercel.app",
];

// Middlewares
app.use(responseUtilities);
app.use(cors({ origin: whitelist, exposedHeaders: ["X-API-TOKEN"] }));

app.use(
  conditionalMiddleware(
    express.json(),
    (req) => req.originalUrl !== "/api/v1/webhooks/stripe"
  )
);

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Initialize Google Auth Strategy
GoogleService.initializePassport();

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
