/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

// Common validation schemas that can be reused across the application

// UUID validation
export const uuidValidator = (value: string) => {
  const schema = z.string().uuid("Must be a valid UUID");
  const result = schema.safeParse(value);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};
