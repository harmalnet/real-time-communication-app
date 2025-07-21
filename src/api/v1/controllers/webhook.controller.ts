/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

// import { ResourceNotFound } from "../../../errors/httpErrors";
import Transaction from "../../../db/models/transaction.model";
import User from "../../../db/models/user.model";
import { successfulTransactionNotification } from "../../../services/email.service";

const secret = process.env.PAYSTACK_SECRET as string;

class WebhookController {
  async paystackWebhook(req: Request, res: Response) {
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.error("Invalid webhook signature");
      return res.sendStatus(403);
    }

    const { event, data } = req.body;
    const reference = data.reference;

    try {
      if (event === "charge.success") {
        const amount = data.amount / 100;
        const email = data.customer.email;

        const existingTransaction = await Transaction.findOne({ reference });
        if (existingTransaction) return res.sendStatus(200);

        const user = await User.findOne({ email });
        if (!user) {
          console.error(`User with email ${email} not found.`);
          return res.sendStatus(404);
        }

        const transaction = new Transaction({
          userId: user._id,
          transactionType: "FUND",
          amount,
          currency: data.currency,
          description: data.metadata?.description || "Deposit to wallet",
          reference,
          status: "COMPLETED",
          paymentGateway: "PAYSTACK",
          gatewayResponse: data,
          paymentComment: `Using - (${data.authorization.brand}) ${data.authorization.channel} ****${data.authorization.last4}`,
        });
        await transaction.save();



        await successfulTransactionNotification(
          user,
          transaction._id.toString(),
          amount
        );
        console.log(
          `✅ Transaction ${transaction._id} saved for user ${user._id}`
        );
    
      } else if (event === "charge.failed") {
        const amount = data.amount / 100;
        const email = data.customer.email;

        const user = await User.findOne({ email });
        if (!user) {
          console.error(`User with email ${email} not found.`);
          return res.sendStatus(404);
        }

        const transaction = new Transaction({
          userId: user._id,
          transactionType: "FUND",
          amount,
          currency: data.currency,
          description: `Payment for ${data.metadata?.description || "unknown"}`,
          reference,
          status: "FAILED",
          paymentGateway: "PAYSTACK",
          gatewayResponse: data,
          paymentComment: `Using - (${data.authorization.brand}) ${data.authorization.channel} ****${data.authorization.last4}`,
        });
        await transaction.save();

        console.log(`❌ Failed transaction saved for user ${user._id}`);
      } else {
        console.warn(`⚠️ Unhandled event type: ${event}`);
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("⚠️ Error processing webhook:", err);
      res.sendStatus(500);
    }
  }
}

export default new WebhookController();
