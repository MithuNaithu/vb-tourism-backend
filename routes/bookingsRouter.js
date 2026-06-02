import express from "express";
import Booking from "../models/bookingModel.js";
import transporter from "../mailer.js";

const router = express.Router();

// 1. Create Booking
router.post("/", async (req, res) => {
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
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ submittedAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// 3. Delete Booking
router.delete("/:id", async (req, res) => {
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

export default router;
