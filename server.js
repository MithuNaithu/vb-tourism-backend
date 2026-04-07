const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// =============================
// MongoDB Connection
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });

// =============================
// Booking Schema
// =============================
const bookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  service: String,
  date: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model("Booking", bookingSchema);

// =============================
// Brevo Email Transporter
// =============================
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Check transporter
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email Server Error:", error);
  } else {
    console.log("Email Server is Ready");
  }
});

// =============================
// Booking API
// =============================
app.post("/api/bookings", async (req, res) => {
  try {
    // Save booking
    const newBooking = new Booking(req.body);
    await newBooking.save();

    console.log("Booking saved");

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Booking Received - VB Tourism",
      html: `
        <h2>New Booking Details</h2>
        <p><b>Name:</b> ${req.body.name}</p>
        <p><b>Phone:</b> ${req.body.phone}</p>
        <p><b>Email:</b> ${req.body.email}</p>
        <p><b>Date:</b> ${req.body.date}</p>
        <p><b>Message:</b> ${req.body.message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");

    res.status(200).json({
      success: true,
      message: "Booking saved and email sent",
    });
  } catch (error) {
    console.log("Server Error:", error);

    res.status(500).json({
      success: false,
      message: "Booking saved but email failed",
      error: error.message,
    });
  }
});

// =============================
// Admin Booking List
// =============================
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json(error);
  }
});

// =============================
// Root
// =============================
app.get("/", (req, res) => {
  res.send("VB Tourism Backend Running");
});

// =============================
// Server Start
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});