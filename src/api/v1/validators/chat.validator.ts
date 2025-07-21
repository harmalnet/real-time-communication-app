/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

export const createChatValidator = (payload: any) => {
  const schema = z.object({
    bid_id: z.string({
      required_error: "bid ID is required to create a chat",
    }),
    messages: z
      .array(
        z.object({
          sender: z.string({ required_error: "Sender ID is required" }),
          content: z.string({ required_error: "Message content is required" }),
          createdAt: z.date().optional(),
          isRead: z.boolean().default(false).optional(),
          readAt: z.date().optional(),
        })
      )
      .optional(),
  });
  return validateRequestBody(schema, payload);
};

export const updateChatValidator = (payload: any) => {
  const schema = z.object({
    task: z.string().optional(),
    participants: z
      .array(z.string())
      .min(2, "At least two participants are required")
      .optional(),
    messages: z
      .array(
        z.object({
          sender: z.string({ required_error: "Sender ID is required" }),
          content: z.string({ required_error: "Message content is required" }),
          createdAt: z.date().optional(),
          isRead: z.boolean().default(false).optional(),
          readAt: z.date().optional(),
        })
      )
      .optional(),
  });
  return validateRequestBody(schema, payload);
};
export const sendMessageValidator = (payload: any) => {
  const schema = z.object({
    content: z.string({ required_error: "Message content is required" }),
  });
  return validateRequestBody(schema, payload);
};
