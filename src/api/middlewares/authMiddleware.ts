import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../../db/models/User";
import { Unauthorized } from "../../errors/httpErrors";

interface JwtPayload {
  userId: string;
  username: string;
}

export const Auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new Unauthorized("Access token is required", "MISSING_AUTH_HEADER");
      }

      const decoded = jwt.verify(token, process.env.JWT_SEC as string) as JwtPayload;
      
      // Verify user exists and is active
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new Unauthorized("Invalid token", "INVALID_TOKEN");
      }

      // Attach user info to request
      (req as Request & { user: JwtPayload; loggedInAccount: typeof user }).loggedInAccount = user;
      
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Unauthorized("Invalid token", "INVALID_TOKEN");
      }
      throw error;
    }
  };
};

const middleware = Auth();
export { middleware as AuthMiddleware };
export default middleware;
