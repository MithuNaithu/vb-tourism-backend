const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); 

// Import the Booking model
const Booking = require('./models/booking');

const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// 2. GET route to fetch all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const allBookings = await Booking.find().sort({ submittedAt: -1 });
        res.json(allBookings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch" });
    }
});

// --- DELETE A BOOKING ---
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const deletedBooking = await Booking.findByIdAndDelete(bookingId);
        
        if (!deletedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        res.status(200).json({ message: 'Booking deleted successfully!' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: 'Server error while deleting' });
    }
});

// 3. POST route to receive a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { name, email, phone, service, date } = req.body;

        if (!name || !phone || !service) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        const newBooking = new Booking({ name, email, phone, service, date });
        await newBooking.save();
        console.log("✨ New booking saved to MongoDB!");

        // Send success to frontend immediately
        res.status(201).json({ message: "Booking successful!" });

        // TRY SENDING EMAIL IN THE BACKGROUND
        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,         // Most stable for Gmail
                secure: true,      // true for 465
                family: 4,         // Forces IPv4
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, 
                subject: `New Booking: ${service}`,
                text: `You have a new lead!\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nDate: ${date}\nService: ${service}`
            };

            await transporter.sendMail(mailOptions);
            console.log("📧 Notification email sent!");

        } catch (emailError) {
            console.error("❌ Email failed to send, but booking was saved:", emailError);
        }

    } catch (error) {
        console.error("❌ Server Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

// 4. Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server is live on http://localhost:${PORT}`);
});