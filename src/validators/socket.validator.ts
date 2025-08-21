/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
// Socket event validation schemas

// Join room event validation
export const joinRoomEventValidator = (data: any) => {
  const schema = z.object({
    roomId: z.string({ required_error: "Room ID is required" }).uuid("Room ID must be a valid UUID"),
  });
  
  const result = schema.safeParse(data);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};

// Typing indicator event validation
export const typingEventValidator = (data: any) => {
  const schema = z.object({
    roomId: z.string({ required_error: "Room ID is required" }).uuid("Room ID must be a valid UUID"),
    isTyping: z.boolean({ required_error: "isTyping flag is required" }),
  });
  
  const result = schema.safeParse(data);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};

// Send message event validation
export const sendMessageEventValidator = (data: any) => {
  const schema = z.object({
    roomId: z.string({ required_error: "Room ID is required" }).uuid("Room ID must be a valid UUID"),
    content: z
      .string({ required_error: "Message content is required" })
      .min(1, "Message content is required")
      .max(1000, "Message must not exceed 1000 characters")
      .trim(),
  });
  
  const result = schema.safeParse(data);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};

// Edit message event validation
export const editMessageEventValidator = (data: any) => {
  const schema = z.object({
    messageId: z.string({ required_error: "Message ID is required" }).uuid("Message ID must be a valid UUID"),
    content: z
      .string({ required_error: "Message content is required" })
      .min(1, "Message content is required")
      .max(1000, "Message must not exceed 1000 characters")
      .trim(),
  });
  
  const result = schema.safeParse(data);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};

// Delete message event validation
export const deleteMessageEventValidator = (data: any) => {
  const schema = z.object({
    messageId: z.string({ required_error: "Message ID is required" }).uuid("Message ID must be a valid UUID"),
  });
  
  const result = schema.safeParse(data);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};

// Mark message as read event validation
export const markMessageReadEventValidator = (data: any) => {
  const schema = z.object({
    messageId: z.string({ required_error: "Message ID is required" }).uuid("Message ID must be a valid UUID"),
  });
  
  const result = schema.safeParse(data);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};
