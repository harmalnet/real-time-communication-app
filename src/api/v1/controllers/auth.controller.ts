import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { User } from "../../../db/models/User";
import { Unauthorized, Conflict, BadRequest } from "../../../errors/httpErrors";
import { registerValidator, loginValidator } from "../../../validators/auth.validator";

class ChatAuthController {
  async register(req: Request, res: Response) {
    const { error, data } = registerValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { username, email, password, fullName } = data;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new Conflict("User with this email or username already exists", "EXISTING_USER_EMAIL");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      isOnline: false,
    });

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SEC as string, { expiresIn: "24h" });

    return res.created({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isOnline: user.isOnline,
      },
      token,
    });
  }

  async login(req: Request, res: Response) {
    const { error, data } = loginValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { email, password } = data;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Unauthorized("Invalid credentials", "INVALID_PASSWORD");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Unauthorized("Invalid credentials", "INVALID_PASSWORD");
    }

    await user.update({ isOnline: true });

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SEC as string, { expiresIn: "24h" });

    return res.ok({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
      token,
    });
  }

  async logout(req: Request, res: Response) {
    const user = (req as Request & { user?: { userId: string } }).user;
    
    if (user) {
      await User.update(
        { isOnline: false, lastSeen: new Date() },
        { where: { id: user.userId } }
      );
    }

    return res.ok("Logout successful");
  }

  async getProfile(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string } }).user;
    
    const userProfile = await User.findByPk(user.userId, {
      attributes: ["id", "username", "email", "fullName", "isOnline", "lastSeen", "createdAt"]
    });

    if (!userProfile) {
      throw new Unauthorized("User not found", "INVALID_TOKEN");
    }

    return res.ok(userProfile);
  }
}

export default new ChatAuthController();
