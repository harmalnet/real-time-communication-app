import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscriptionLog extends Document {
  companyId: mongoose.Types.ObjectId;
  subscriptionPlanId: mongoose.Types.ObjectId;
  subscriptionPlan: string;
  stripeSessionId: string;
  status: "pending" | "completed" | "failed" | "canceled" | "expired";
  paidAt: Date;
  amount: number;
  createdAt: Date;
}

const subscriptionLogSchema = new Schema<ISubscriptionLog>(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    subscriptionPlan: String,
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    stripeSessionId: {
      type: String,
    },
    status: {
      type: String,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const SubscriptionLogModel: Model<ISubscriptionLog> =
  mongoose.model<ISubscriptionLog>("SubscriptionLog", subscriptionLogSchema);

export default SubscriptionLogModel;
