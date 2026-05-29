const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    city: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown' },
    visitedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visitor', visitorSchema);