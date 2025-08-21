/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../utils/zodHelpers";
import { uuidValidator } from "./common.validator";

// Room creation validation
export const createRoomValidator = (payload: any) => {
  const schema = z.object({
    name: z
      .string({ required_error: "Room name is required" })
      .min(1, "Room name is required")
      .max(100, "Room name must not exceed 100 characters")
      .trim(),

    description: z.string().max(500, "Description must not exceed 500 characters").optional(),

    isPrivate: z.boolean().default(false),

    inviteCode: z
      .string()
      .min(6, "Invite code must be at least 6 characters")
      .max(20, "Invite code must not exceed 20 characters")
      .optional(),
  });
  return validateRequestBody(schema, payload);
};

// Room join validation
export const joinRoomValidator = (payload: any) => {
  const schema = z
    .object({
      roomId: z.string({ required_error: "Room ID is required" }).uuid().optional(),
      inviteCode: z.string({ required_error: "Invite code is required" }).min(1).max(20).optional(),
    })
    .refine((data) => data.roomId !== undefined || data.inviteCode !== undefined, {
      message: "Either roomId or inviteCode must be provided",
      path: ["roomId", "inviteCode"],
    });
  return validateRequestBody(schema, payload);
};

// Message validation
export const sendMessageValidator = (payload: any) => {
  const schema = z.object({
    roomId: z.string({ required_error: "Room ID is required" }).uuid("Room ID must be a valid UUID"),

    content: z
      .string({ required_error: "Message content is required" })
      .min(1, "Message content is required")
      .max(1000, "Message must not exceed 1000 characters")
      .trim(),
  });
  return validateRequestBody(schema, payload);
};

// Message editing validation
export const editMessageValidator = (payload: any) => {
  const schema = z.object({
    content: z
      .string({ required_error: "Message content is required" })
      .min(1, "Message content is required")
      .max(1000, "Message must not exceed 1000 characters")
      .trim(),
  });
  return validateRequestBody(schema, payload);
};

// URL parameter validation for room ID
export const roomIdParamValidator = (roomId: string) => {
  return uuidValidator(roomId);
};

// URL parameter validation for message ID
export const messageIdParamValidator = (messageId: string) => {
  return uuidValidator(messageId);
};

// Query parameter validation for pagination
export const paginationQueryValidator = (query: any) => {
  const schema = z.object({
    page: z.string().optional().transform(val => Math.max(Number(val) || 1, 1)),
    limit: z.string().optional().transform(val => Math.min(Number(val) || 20, 100)),
  });
  
  const result = schema.safeParse(query);
  
  if (result.success) return { data: result.data };
  return { error: { code: "INVALID_REQUEST_PARAMETERS" as const, message: result.error.errors[0].message } };
};
