import express from "express";
import mongoose from "mongoose";
import geoip from "geoip-lite";
import Visitor from "./models/visitorModel.js";
import bookingsRouter from "./routes/bookingsRouter.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "https://www.valiyaparambatourism.com",
      "https://valiyaparambatourism.com",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// =============================
// MongoDB Connection
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// =============================
// API Routes (Bookings)
app.use("/api/bookings", bookingsRouter);

// =============================
// API Routes (Visitor Tracking)

// 4. Record a Live Visit
app.get("/api/visit", async (req, res) => {
  try {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (ip && ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    const geo = geoip.lookup(ip);
    const city = geo ? geo.city : "Local/Unknown";
    const country = geo ? geo.country : "Local/Unknown";

    await Visitor.create({
      ip,
      city,
      country,
    });

    const totalVisitors = await Visitor.countDocuments();
    res.json({ count: totalVisitors });
  } catch (error) {
    console.error("Visitor tracking error:", error);
    res.status(500).json({ error: "Failed to track visitor" });
  }
});

// 5. Admin Visitor Log List
app.get("/api/admin/visitors", async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ visitedAt: -1 }).limit(100);
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
});

// 6. Delete a Single Visitor Log
app.delete("/api/admin/visitors/:id", async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete log" });
  }
});

// 7. Clear ALL Visitor Logs
app.delete("/api/admin/visitors", async (req, res) => {
  try {
    await Visitor.deleteMany({});
    res.status(200).json({ message: "All visitor logs cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear logs" });
  }
});

// =============================
// System Base Routes
// =============================

// Root Status Route
app.get("/", (req, res) => {
  res.send("VB Tourism Backend Running 🚀");
});

// Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
