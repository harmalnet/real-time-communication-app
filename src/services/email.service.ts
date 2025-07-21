/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  INotification,
  NotificationType,
} from "../db/models/notification.model";
import { IUser } from "../db/models/user.model";
import helper, { sendMail, EmailOptions } from "../utils/notificationHelper";
import { publishNotification } from "../config/redis.config";
import dotenv from "dotenv";
dotenv.config();

async function verifyEmailNotification(
  email: string,
  firstName: string,
  otp: string
): Promise<void> {
  const htmlContent = await helper.sendOTPEmail(firstName, otp);
  const options: EmailOptions = {
    to: email,
    subject: "Verify your Email address",
    htmlContent,
  };
  await sendMail(options);
}

async function welcomeNotification(
  email: string,
  firstName: string,
  userId: string
): Promise<void> {
  const htmlContent = await helper.sendWelcomeEmail(firstName);
  const subject = "Welcome to Crownlist";
  const options: EmailOptions = {
    to: email,
    subject,
    htmlContent: htmlContent,
  };
  const notOptions: INotification = {
    userId,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.WELCOME,
    isRead: false,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}
async function updateNotification(
  email: string,
  firstName: string,
  userId: string
): Promise<void> {
  const htmlContent = await helper.sendUpdateNotificationEmail(firstName);
  const subject = "Profile Updated";
  const options: EmailOptions = {
    to: email,
    subject,
    htmlContent: htmlContent,
  };
  const notOptions: INotification = {
    userId,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.PROFILE_UPDATE,
    isRead: false,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function resetPasswordEmail(
  email: string,
  firstName: string,
  resetLink: string
): Promise<void> {
  const htmlContent = await helper.resetPasswordEmail(firstName, resetLink);
  const options: EmailOptions = {
    to: email,
    subject: "Reset Your CrownList Account Password",
    htmlContent: htmlContent,
  };
  await sendMail(options);
}

async function successChangedPasswordEmail(
  email: string,
  firstName: string
): Promise<void> {
  const htmlContent = await helper.successChangedPasswordEmail(firstName);
  const options: EmailOptions = {
    to: email,
    subject: "Your CrownList PIN Has Been Changed Successfully",
    htmlContent,
  };
  const notOptions: INotification = {
    userId: email,
    title: "PIN Changed Successfully",
    content: htmlContent,
    notificationType: NotificationType.PROFILE_UPDATE,
    isRead: false,
  };
  await sendMail(options);
  await publishNotification(notOptions);
}

async function jobcreatedSuccessfullyEmail(
  user: any,
  jobTitle: string
): Promise<void> {
  const htmlContent = await helper.notifyClientJobCreated(
    user.firstName,
    jobTitle
  );
  const options: EmailOptions = {
    to: user.email,
    subject: "Job Created Successfully",
    htmlContent,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: "Job Created Successfully",
    content: htmlContent,
    notificationType: NotificationType.JOB_CREATED,
  };
  await sendMail(options);
  await publishNotification(notOptions);
}

async function newBidReceivedNotification(
  task: any,
  user: any,
  bidAmount: number,
  currency: string
): Promise<void> {
  const htmlContent = await helper.newBid(
    task.client_id.firstName,
    task.title,
    user.firstName,
    bidAmount,
    currency
  );
  const subject = `New Bid Received for ${task.title}`;
  const options: EmailOptions = {
    to: task.client_id.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: task.client_id._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.NEW_BID_RECEIVED,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function clientBidAcceptedNotification(
  user: any,
  jobTitle: string,
  providerName: any,
  bidAmount: number,
  currency: string
): Promise<void> {
  const htmlContent = await helper.clientAcceptedBid(
    user.firstName,
    providerName.firstName,
    jobTitle,
    bidAmount,
    currency
  );
  const subject = `Bid Accepted for ${jobTitle}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.BID_ACCEPTED,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function providerBidAcceptedNotification(
  user: any,
  jobTitle: string,
  bidAmount: number,
  currency: string
): Promise<void> {
  const htmlContent = await helper.notifyProviderBidAccepted(
    user.firstName,
    jobTitle,
    bidAmount,
    currency
  );
  const subject = `Your Bid Accepted for ${jobTitle}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.BID_ACCEPTED,
    isRead: false,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function providerBidRejectedNotification(
  user: any,
  jobTitle: string,
  bidAmount: number,
  currency: string
): Promise<void> {
  const htmlContent = await helper.notifyProviderBidRejected(
    user.firstName,
    jobTitle,
    bidAmount,
    currency
  );
  const subject = `Your Bid Rejected for ${jobTitle}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.BID_REJECTED,
    isRead: false,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function taskUpdateNotification(
  user: any,
  taskTitle: string
): Promise<void> {
  const htmlContent = await helper.notifyClientTaskUpdate(
    user.firstName,
    taskTitle
  );
  const subject = `Task Update: ${taskTitle}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.TASK_UPDATE,
    isRead: false,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function taskCancellationRequest(user:any, taskTitle:string): Promise<void> {
  const htmlContent = await helper.notifyUserTaskCancellation(
    user.firstName,
    taskTitle
  );
  const subject = `Task Cancellation Request: ${taskTitle}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.TASK_CANCELLATION,
    isRead: false,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function taskSubmittedNotification(
  user: any,
  taskTitle: string
): Promise<void> {
  const htmlContent = await helper.notifyClientTaskSubmitted(
    user.firstName,
    taskTitle
  );
  const subject = `Task Submitted: ${taskTitle}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.JOB_COMPLETED,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function paymentReleasedNotification(
  user: any,
  taskTitle: string,
  amount: number,
  currency: string
): Promise<void> {
  const htmlContent = await helper.notifyProviderPaymentReleased(
    user.firstName,
    amount,
    currency,
    taskTitle
  );
  const subject = `Payment Released for ${taskTitle}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.PAYMENT_DELIVERED,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function successfulTransactionNotification(
  user: IUser,
  transactionId: string,
  amount: number
): Promise<void> {
  const htmlContent = await helper.successTransactionNotification(
    user.fullName,
    transactionId,
    JSON.stringify(amount)
  );
  const subject = `ALERT: Your transaction was successful - ${transactionId}`;
  const options: EmailOptions = {
    to: user.email,
    htmlContent,
    subject,
  };
  const notOptions: INotification = {
    userId: user._id,
    title: subject,
    content: htmlContent,
    notificationType: NotificationType.NEW_TRANSACTION,
    isRead: false,
  };

  await sendMail(options);
  await publishNotification(notOptions);
}

async function contactUsUserCopy(
  email: string,
  firstName: string,
): Promise<void> {
  const htmlContent = await helper.contactUsUserCopy(firstName);
  const options: EmailOptions = {
    to: email,
    subject: "Copy of email sent to CrownList",
    htmlContent,
  };
  await sendMail(options);
}

async function contactUsAdminCopy(
  email: string,
  admin: string,
  firstName: string,
  message: string
): Promise<void> {
  const htmlContent = await helper.contactUsAdminCopy(firstName,email,`Message from ${firstName}`, message);
  const options: EmailOptions = {
    to: admin,
    subject: `Message from ${firstName}`,
    htmlContent,
  };
  await sendMail(options);
}
// async function testEmail(email: string) {
//   const options = {
//     to: email,
//     subject: "Accept invitation to attend event",
//     template: "test",
//   };

//   await sendMail(options);
// }

export {
  verifyEmailNotification,
  welcomeNotification,
  updateNotification,
  resetPasswordEmail,
  successChangedPasswordEmail,
  successfulTransactionNotification,
  jobcreatedSuccessfullyEmail,
  newBidReceivedNotification,
  clientBidAcceptedNotification,
  providerBidAcceptedNotification,
  providerBidRejectedNotification,
  taskUpdateNotification,
  taskCancellationRequest,
  taskSubmittedNotification,
  paymentReleasedNotification,
  contactUsAdminCopy,
  contactUsUserCopy
};
