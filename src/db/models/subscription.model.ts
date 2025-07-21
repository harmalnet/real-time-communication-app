import mongoose, { Document, Model, Schema } from "mongoose";

type SubscriptionStatus = "active" | "expired" | "failed" | "pending";

export interface ISubscription extends Document {
  companyId: mongoose.Types.ObjectId;
  subscriptionPlanId: mongoose.Types.ObjectId;
  subscriptionPlanName: string;
  stripePlanId: string;
  paidAt: Date;
  expiresAt: Date;
  status: SubscriptionStatus;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    subscriptionPlanName: {
      type: String,
      required: true,
    },
    stripePlanId: {
      type: String,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "failed", "pending"],
      required: true,
    },
  },
  { timestamps: true },
);

const SubscriptionModel: Model<ISubscription> = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);

export default SubscriptionModel;