const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); 


// Import the Booking model we created earlier
const Booking = require('./models/booking');

const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(cors());
app.use(express.json());

//console.log("Mongo URI:", process.env.MONGO_URI);

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// 2. Test route (to check if server is working in browser)
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
        
        // Find the booking by its ID in MongoDB and remove it
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
// 3. POST route to receive a new booking from React
app.post('/api/bookings', async (req, res) => {
    try {
        const { name, email, phone, service, date } = req.body;

        // Validation
        if (!name || !phone || !service) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        // Save to Database
        const newBooking = new Booking({ name, email, phone, service, date });
        await newBooking.save();
        console.log("✨ New booking saved to MongoDB!");

        // Email Notification Setup
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            family: 4, // THIS IS THE MAGIC FIX: Forces IPv4 instead of IPv6
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

        res.status(201).json({ message: "Booking successful!" });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 4. Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server is live on http://localhost:${PORT}`);
});