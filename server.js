const express = require("express");
const mongoose = require("mongoose");
const geoip = require('geoip-lite');
const Visitor = require('./models/visitor'); // Make sure the case matches your filename exactly
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
  submittedAt: {
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
  port: 2525,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Transporter
transporter.verify(function (error, success) {
  if (error) {
    console.log("⚠️ Email Server Note:", error.message);
  } else {
    console.log("📧 Email Server is Ready");
  }
});

// =============================
// API Routes
// =============================

// 1. Create Booking
app.post("/api/bookings", async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    console.log("✨ Booking saved to MongoDB");

    res.status(201).json({ success: true, message: "Booking saved" });

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
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
      console.log("📧 Email sent successfully");
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

// 2. Admin Booking List
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ submittedAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// 3. Delete Booking
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
// --- VISITOR COUNTER & LOCATION TRACKING ---
app.get('/api/visit', async (req, res) => {
    try {
        // 1. Get the true IP address (Handles Render's proxy and local testing)
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Clean the IP if it comes as a list
        if (ip && ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }

        // 2. Look up the location using the IP
        const geo = geoip.lookup(ip);
        
        // If testing locally (localhost/::1), geoip might return null. We set fallbacks.
        const city = geo ? geo.city : 'Local/Unknown';
        const country = geo ? geo.country : 'Local/Unknown';

        // 3. Save this visitor's data to MongoDB
        await Visitor.create({ 
            ip: ip, 
            city: city, 
            country: country 
        });

        // 4. Count all documents in the Visitor collection
        const totalVisitors = await Visitor.countDocuments();

        // 5. Send the grand total back to the React frontend
        res.json({ count: totalVisitors });

    } catch (error) {
        console.error("Visitor tracking error:", error);
        res.status(500).json({ error: "Failed to track visitor" });
    }
});

// Root Route
app.get("/", (req, res) => {
  res.send("VB Tourism Backend Running 🚀");
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});