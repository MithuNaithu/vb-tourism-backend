const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    city: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown' },
    visitedAt: { 
        type: Date, 
        default: Date.now,
        expires: 2592000 // Automatically deletes from MongoDB after 30 days (in seconds)
    }
});

module.exports = mongoose.model('Visitor', visitorSchema);