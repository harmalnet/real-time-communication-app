/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

// Redis message validation schemas

// Chat message validation for Redis pub/sub
export const chatMessageValidator = (data: any) => {
  const schema = z.object({
    senderId: z.string({ required_error: "Sender ID is required" }).uuid("Sender ID must be a valid UUID"),
    recipientId: z.string({ required_error: "Recipient ID is required" }).uuid("Recipient ID must be a valid UUID"),
    content: z
      .string({ required_error: "Message content is required" })
      .min(1, "Message content is required")
      .max(1000, "Message content too long"),
    chat_id: z.string().uuid("Chat ID must be a valid UUID").optional(),
    senderName: z.string({ required_error: "Sender name is required" }).min(1, "Sender name is required"),
    isRead: z.boolean().default(false),
    createdAt: z.string().datetime("Created at must be a valid date").optional(),
  });
  
  const result = schema.safeParse(data);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};
