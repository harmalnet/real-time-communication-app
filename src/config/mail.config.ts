import nodemailer from "nodemailer";


// Create Nodemailer transporter for Gmail
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail email address
    pass: process.env.GMAIL_PASS, // Your Gmail password or App Password if 2FA is enabled
  },
});


