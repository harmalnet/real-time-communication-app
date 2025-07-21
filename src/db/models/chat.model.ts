import mongoose, { Document, Model, Schema } from "mongoose";

export interface IChat extends Document {
  task_id: mongoose.Schema.Types.ObjectId; // The job associated with the chat
  participants: mongoose.Schema.Types.ObjectId[]; // Array of users involved in the chat (job poster and service provider)
  messages: {
    sender: string; // The user who sent the messag;
    content: string;
    createdAt: Date;
    isRead: boolean;
    readAt?: Date;
  }[]; // Array of messages exchanged in the chat
  createdAt: Date; // Timestamp of when the chat was created
  updatedAt: Date; // Timestamp of when the chat was last updated
}

const chatSchema = new Schema<IChat>({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      isRead: {
        type: Boolean,
        default: false,
      },
      readAt: {
        type: Date,
        default: null,
      },
    },
  ],
},
{ timestamps: true });

const ChatModel: Model<IChat> = mongoose.model<IChat>("Chat", chatSchema);
export default ChatModel;
