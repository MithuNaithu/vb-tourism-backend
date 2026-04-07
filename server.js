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
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// =============================
// Booking Schema
// =============================
const bookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  service: String,
  date: String,
  submittedAt: { // Changed to submittedAt to match your React frontend logic
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
  port: 2525, // CRITICAL FIX: Port 2525 bypasses Render's Port 587 block!
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Make sure this is your Brevo SMTP Master Password
  },
});

// Check transporter in the background
transporter.verify(function (error, success) {
  if (error) {
    console.log("⚠️ Brevo Server Note:", error.message);
  } else {
    console.log("📧 Brevo Email Server is Ready");
  }
});

// =============================
// API 1: Create Booking
// =============================
app.post("/api/bookings", async (req, res) => {
  try {
    // 1. Save booking to database
    const newBooking = new Booking(req.body);
    await newBooking.save();
    console.log("✨ Booking saved to MongoDB");

    // 2. SEND SUCCESS IMMEDIATELY (Prevents UI freezing on the website)
    res.status(201).json({ success: true, message: "Booking saved" });

    // 3. Send Email in Background
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Sending notification to yourself
        subject: `📢 New Booking: ${req.body.service}`,
        html: `
          <h2>New Website Enquiry</h2>
          <p><b>Name:</b> ${req.body.name}</p>
          <p><b>Phone:</b> ${req.body.phone}</p>
          <p><b>Email:</b> ${req.body.email || 'Not provided'}</p>
          <p><b>Service:</b> ${req.body.service}</p> 
          <p><b>Date:</b> ${req.body.date}</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("📧 Brevo Email sent successfully");
    } catch (emailError) {
      console.log("❌ Email failed in background:", emailError.message);
    }

  } catch (error) {
    console.log("❌ Server Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  }
});

// =============================
// API 2: Admin Booking List
// =============================
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ submittedAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// =============================
// API 3: Delete Booking (RESTORED!)
// =============================
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json({ message: "Booking deleted successfully!" });
  } catch (error) {
    console.error("❌ Delete Error:", error.message);
    res.status(500).json({ message: "Server error while deleting" });
  }
});

// =============================
// Root
// =============================
app.get("/", (req, res) => {
  res.send("VB Tourism Backend Running 🚀");
});

// =============================
// Server Start
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});