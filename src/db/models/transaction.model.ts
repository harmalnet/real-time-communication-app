import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITransaction extends Document {
  companyId?: mongoose.Types.ObjectId;
  subscriptionLogId?: string;
  transactionCustomId: string;
  invoiceId: string;
  invoicePdf: string;
  invoiceAmount: string;
  transactionType: "Subscription" | "One-time";
  amount: number;
  status: "Pending" | "Success" | "Failed" | "Canceled";
  paymentMethod: "Stripe";
  paymentComment: string;
  billingCycleStart?: Date;
  billingCycleEnd?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    subscriptionLogId: {
      type: String,
      required: function () {
        return this.transactionType === "Subscription";
      },
    },
    transactionCustomId: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Subscription", "One-time"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed", "Canceled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Stripe"],
      required: true,
    },
    paymentComment: {
      type: String,
      required: true,
    },
    invoiceId: {
      type: String,
    },
    invoicePdf: {
      type: String,
    },
    invoiceAmount: {
      type: String,
    },
    billingCycleStart: {
      type: Date,
    },
    billingCycleEnd: {
      type: Date,
    },
  },
  { timestamps: true }
);

const TransactionModel: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);

export default TransactionModel;
