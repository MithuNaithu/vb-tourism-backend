import mongoose from "mongoose";

// This defines the exact structure of the data coming from your React form
const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  // We add this to automatically record exactly when they clicked submit!
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model so server.js can use it
export default mongoose.model("Booking", bookingSchema);