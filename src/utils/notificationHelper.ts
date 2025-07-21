/* eslint-disable @typescript-eslint/no-explicit-any */
import { transporter } from "../config/mail.config";
import moment from "moment";
import { NotificationType } from "../db/models/notification.model";

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  time?: Date;
  version?: string;
}

export interface NotificationOptions {
  userId: string;
  title: string;
  content: any;
  notificationType: NotificationType;
}

//send Mail
// Send mail function
async function sendMail({
  to,
  subject,
  htmlContent,
}: EmailOptions): Promise<any> {
  // Message object

  const messageData = {
    from: `CrownList Support <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  };

  // Send the email
  return transporter.sendMail(messageData);
}

// //schedule Mail
// Schedule mail function
async function scheduleMail({
  to,
  // template,
  subject,
  time,
}: EmailOptions): Promise<any> {
  const sendAt = moment(time).toDate();

  const messageData = {
    from: `Your App <${process.env.GMAIL_USER}>`,
    to,
    subject,
    sendAt, // Include sendAt to specify the schedule
  };

  // Send email at a specific time
  return transporter.sendMail(messageData);
}

class templateService {
  sendOTPEmail = async (userName: string, otp: string) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
      p { font-size: 16px; line-height: 1.5; }
      .otp { font-size: 24px; font-weight: bold; color: #023247; text-align: center; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Email Confirmation</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>Use the OTP below to verify your email address. This OTP is valid for the next 10 minutes:</p>
      <div class="otp">${otp}</div>
      <p>If you didn’t request this, please ignore this email.</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };

  sendWelcomeEmail = async (firstName: string) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to CrownList!</h1>
      <p>Hi ${firstName},</p>
      <p>We’re excited to have you onboard. You can now start exploring the unmatched email security we provide.</p>
      <p>Let us know if you need any help!</p>
      <p>Cheers,<br>The CrownList Team</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };
  sendUpdateNotificationEmail = async (firstName: string) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to CrownList!</h1>
      <p>Hi ${firstName},</p>
      <p>Your profile has been successfully updated.</p>
      <p>Let us know if you need any help!</p>
      <p>Cheers,<br>The CrownList Team</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };

  resetPasswordEmail = async (userName: string, otp: string) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
     body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
      p { font-size: 16px; line-height: 1.5; }
      .otp { font-size: 24px; font-weight: bold; color: #023247; text-align: center; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Password Reset Request</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>You requested to reset your password. </p>
      <p>Use the OTP below to verify your email address. This OTP is valid for the next 10 minutes:</p>
      <div class="otp">${otp}</div>
      <p>If you didn’t request this, please ignore this email.</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };

  successChangedPasswordEmail = async (userName: string) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Password Successfully Changed</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>Your password has been successfully updated. If you did not make this change, please contact support immediately.</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };

  newTransactionNotification = async (
    userName: string,
    transactionId: string,
    amount: string
  ) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Transaction Alert</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>A new transaction has been processed on your account:</p>
      <p><b>Transaction ID:</b> ${transactionId}</p>
      <p><b>Amount:</b> ${amount}</p>
      <p>If you did not authorize this, please contact support immediately.</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };

  // Template for successful transaction notification
  successTransactionNotification = async (
    userName: string,
    transactionId: string,
    amount: string
  ) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Transaction Successful</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>Your transaction with ID <b>${transactionId}</b> has been successfully completed.</p>
      <p><b>Amount:</b> ${amount}</p>
      <p>Thank you for using our service!</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };

  successOrderNotification = async (userName: string, orderId: string) => {
    const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Order Confirmation</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>Your order with ID <b>${orderId}</b> has been successfully placed. You will receive further updates shortly.</p>
    </div>
  </body>
  </html>
  `;
    return emailTemplate;
  };

  notifyClientJobCreated = async (clientName: string, jobTitle: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>Job Posted Successfully</h1>
        <p>Hello <b>${clientName}</b>,</p>
        <p>Your job <b>${jobTitle}</b> has been successfully created and is now live for bids.</p>
      </div>
    </body>
    </html>
    `;
  };

  /* Template for bid notifications notification
  start from here */
  newBid = async (
    clientName: string,
    taskTitle: string,
    providerName: string,
    amount: number,
    currency: string
  ) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>New Bid on Your Task</h1>
        <p>Hello <b>${clientName}</b>,</p>
        <p><b>${providerName}</b> has submitted a bid of ${amount} ${currency} on your task: <b>${taskTitle}</b>.</p>
        <p>Login to review the bid and take action.</p>
      </div>
    </body>
    </html>
    `;
  };

  clientAcceptedBid = async (
    clientName: string,
    providerName: string,
    jobTitle: string,
    amount: number,
    currency: string
  ) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>Bid Accepted</h1>
        <p>Hello <b>${clientName}</b>,</p>
        <p>You accepted <b>${providerName}</b>'s bid for ${jobTitle}. Your wallet has been charged with <b>${amount} ${currency}</b>.</p>
      </div>
    </body>
    </html>
    `;
  };

  notifyProviderBidAccepted = async (
    providerName: string,
    jobTitle: string,
    amount: number,
    currency: string
  ) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>Your Bid Was Accepted</h1>
        <p>Hello <b>${providerName}</b>,</p>
        <p>Congratulations! Your bid of ${amount} ${currency} for <b>${jobTitle}</b> has been accepted. Please begin the task as soon as possible.</p>
      </div>
    </body>
    </html>
    `;
  };

  notifyProviderBidRejected = async (
    providerName: string,
    jobTitle: string,
    amount: number,
    currency: string
  ) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>Bid Rejected</h1>
        <p>Hello <b>${providerName}</b>,</p>
        <p>Unfortunately, your bid of ${amount} ${currency} for <b>${jobTitle}</b> has been rejected. You can continue to apply for other jobs.</p>
      </div>
    </body>
    </html>
    `;
  };

  notifyClientTaskUpdate = async (clientName: string, jobTitle: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>Task Update</h1>
        <p>Hello <b>${clientName}</b>,</p>
        <p>Your service provider has sent an update on the task: <b>${jobTitle}</b>.</p>
        <p>Login to review the update and take action.</p>
      </div>
    </body>
    </html>
    `;
  };

  notifyUserTaskCancellation = async(userName: string, jobTitle: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
      </style>
    </head>
    <body>
      <div class="container">
      <h1>Task Cancellation Notice</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>We regret to inform you that the opposition party for the task <b>${jobTitle}</b> has requested to cancel the task.</p>
      <p>If you have any questions or need further assistance, please contact our support team.</p>
      </div>
    </body>
    </html>
    `;
  }
  notifyClientTaskSubmitted = async (clientName: string, jobTitle: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>Task Submitted</h1>
        <p>Hello <b>${clientName}</b>,</p>
        <p>The service provider has submitted the work for <b>${jobTitle}</b>. Please review and release payment if satisfied.</p>
      </div>
    </body>
    </html>
    `;
  };

  notifyProviderPaymentReleased = async (
    providerName: string,
    amount: number,
    currency: string,
    jobTitle: string
  ) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><style>/* common styles */</style></head>
    <body>
      <div class="container">
        <h1>Payment Released</h1>
        <p>Hello <b>${providerName}</b>,</p>
        <p>The client has released <b>${amount} ${currency}</b> for the job <b>${jobTitle}</b>. It has been credited to your wallet.</p>
      </div>
    </body>
    </html>
    `;
  };

  contactUsUserCopy = async (userName: string) => {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>We've Received Your Message</h1>
      <p>Hello <b>${userName}</b>,</p>
      <p>Thank you for reaching out to us. Your message has been successfully received, and a member of our team will get back to you shortly.</p>
      <p>We appreciate your patience.</p>
      <p>Cheers,<br>The CrownList Team</p>
    </div>
  </body>
  </html>
  `;
  };

  contactUsAdminCopy = async (
    userName: string,
    userEmail: string,
    subject: string,
    message: string
  ) => {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #023247; }
      p, pre { font-size: 15px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>New Contact Us Message</h1>
      <p><b>Name:</b> ${userName}</p>
      <p><b>Email:</b> ${userEmail}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Message:</b></p>
      <pre>${message}</pre>
    </div>
  </body>
  </html>
  `;
  };

  // Define other templates here similarly...
}

export { sendMail, scheduleMail };
export default new templateService();
