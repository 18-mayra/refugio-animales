const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: String,
    token: String,
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Session", sessionSchema);