import mongoose, { Model, Schema } from "mongoose";

export enum NotificationType {
  WELCOME = "WELCOME",
  NEW_BID_RECEIVED = "NEW_BID_RECEIVED",
  BID_ACCEPTED = "BID_ACCEPTED",
  BID_REJECTED = "BID_REJECTED",
  JOB_CREATED = "JOB_CREATED",
  JOB_COMPLETED = "JOB_COMPLETED",
  TASK_UPDATE = "TASK_UPDATE",
  BID_SENT = "BID_SENT",
  NEW_JOB_AVAILABLE = "NEW_JOB_AVAILABLE",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  DEPOSIT_COMPLETED = "DEPOSIT_COMPLETED",
  PAYMENT_DELIVERED = "PAYMENT_DELIVERED",
  NEW_MESSAGE = "NEW_MESSAGE",
  JOB_STATUS_UPDATE = "JOB_STATUS_UPDATE",
  NEW_TRANSACTION = "NEW_TRANSACTION",
  PROFILE_UPDATE = "PROFILE_UPDATE",
  TASK_CANCELLATION = "TASK_CANCELLATION"
}

export interface INotification {
  userId: string;
  title: string;
  content: string;
  isRead?: boolean;
  chat_id?: string; // Optional, used for chat-related notifications
  notificationType: NotificationType;
  createdAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    notificationType: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    chat_id: {
      type: String,
      ref: "Chat",
    },
  },
  { timestamps: true }
);

const NotificationModel: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default NotificationModel;
