/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";
import { NotificationType } from "../../../db/models/notification.model";

// Define the validation schema for creating a notification
export const createNotificationValidator = (payload: any) => {
  const schema = z.object({
    userId: z.any({
      required_error: "userid is required to create a notification",
    }),
    title: z.string({
      required_error: "title is required to create a notification",
    }).min(3, "Title must be at least 3 characters long"),
    content: z.string({
      required_error: "content is required to create a notification",
    }).min(5, "Message must be at least 5 characters long"),
    notificationType: z.nativeEnum(NotificationType, {
      required_error: "notificationType is required",
    }),
    chat_id: z.string().optional(),
    isRead: z.boolean().default(false).optional(),
  });
  return validateRequestBody(schema, payload);
};
