import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configured specifically for Gmail using your Google App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Transporter
transporter.verify((error, success) => {
  if (error) {
    console.log("⚠️ Email Server Note:", error.message);
  } else {
    console.log("📧 Email Server is Ready");
  }
});

export default transporter;