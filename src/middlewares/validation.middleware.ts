import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequest } from "../errors/httpErrors";

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join(".")}: ${err.message}`).join(", ");
        throw new BadRequest(errorMessage, "MISSING_REQUIRED_FIELD");
      }
      throw error;
    }
  };
};
