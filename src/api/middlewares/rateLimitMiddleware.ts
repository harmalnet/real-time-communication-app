import { Request, Response, NextFunction } from "express";
import { redisClient } from "../../config/redis.config";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}


export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, message = "Too many requests" } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { userId: string } }).user?.userId;
      const ip = req.ip || req.socket.remoteAddress;
      const key = `rate_limit:${userId || ip}`;

      const current = await redisClient.get(key);
      const requests = current ? parseInt(current) : 0;

      if (requests >= maxRequests) {
        return res.error(429, message, "RATE_LIMIT_EXCEEDED");
      }

      const pipeline = redisClient.multi();
      pipeline.incr(key);
      if (requests === 0) {
        pipeline.expire(key, Math.ceil(windowMs / 1000));
      }
      await pipeline.exec();

      next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      next(); // Continue on error to avoid blocking requests
    }
  };
};

// Message rate limiter: 5 messages per 10 seconds
export const messageRateLimit = rateLimiter({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 5,
  message: "Too many messages sent. Please wait before sending another message.",
});

// General API rate limiter: 100 requests per minute
export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: "Too many API requests. Please try again later.",
});
