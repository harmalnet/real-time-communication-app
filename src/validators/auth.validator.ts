/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../utils/zodHelpers";

// User registration validation
export const registerValidator = (payload: any) => {
  const schema = z.object({
    username: z
      .string({ required_error: "Username is required" })
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username must not exceed 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

    email: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address")
      .max(100, "Email must not exceed 100 characters"),

    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password must not exceed 100 characters"),

    fullName: z
      .string({ required_error: "Full name is required" })
      .min(2, "Full name must be at least 2 characters long")
      .max(100, "Full name must not exceed 100 characters")
      .trim(),
  });
  return validateRequestBody(schema, payload);
};

// User login validation
export const loginValidator = (payload: any) => {
  const schema = z.object({
    email: z.string({ required_error: "Email is required" }).email("Please provide a valid email address"),

    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
  });
  return validateRequestBody(schema, payload);
};
