import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  duration: number;
  stripePlanId: string;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    stripePlanId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const SubscriptionPlanModel: Model<ISubscriptionPlan> =
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlanModel;