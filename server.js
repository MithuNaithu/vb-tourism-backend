```js
// ===============================
// VB Tourism Backend - server.js
// ===============================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Import Booking Model
const Booking = require("./models/booking");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// MongoDB Connection
// ===============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
// ===============================
// Email Transporter
// ===============================
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log("⚠️ Email credentials missing in environment variables");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,         // Use port 465 for a more stable Render connection
  secure: true,      // MUST be true for port 465
  family: 4,         // THE MAGIC FIX: Forces IPv4 to bypass Render's network block
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// ===============================
// Root Route
// ===============================
app.get("/", (req, res) => {
  res.send("VB Tourism Backend is Running 🚀");
});

// ===============================
// Get All Bookings
// ===============================
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ submittedAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("❌ Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ===============================
// Delete Booking
// ===============================
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully!" });
  } catch (error) {
    console.error("❌ Delete Error:", error.message);
    res.status(500).json({ message: "Server error while deleting booking" });
  }
});

// ===============================
// Create Booking
// ===============================
app.post("/api/bookings", async (req, res) => {
  try {
    const { name, email, phone, service, date } = req.body;

    // Validation
    if (!name || !phone || !service) {
      return res.status(400).json({
        error: "Name, Phone and Service are required",
      });
    }

    // Save Booking
    const newBooking = new Booking({
      name,
      email,
      phone,
      service,
      date,
    });

    await newBooking.save();

    console.log("✨ New booking saved to MongoDB!");

    // Send response immediately
    res.status(201).json({
      message: "Booking successful!",
    });

    // ===============================
    // Send Email in Background
    // ===============================
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `📢 New Booking: ${service}`,
        text: `
New Booking Received

Name: ${name}
Phone: ${phone}
Email: ${email}
Date: ${date}
Service: ${service}

Valiyaparamba Backwater Tourism Website
        `,
      };

      await transporter.sendMail(mailOptions);

      console.log("📧 Email sent successfully!");
    } catch (emailError) {
      console.error(
        "❌ Email failed but booking saved:",
        emailError.message
      );
    }
  } catch (error) {
    console.error("❌ Server Error:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server is live on http://localhost:${PORT}`);
});
```
