const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    userId: String,
    token: String,
    expiresAt: Date
});

module.exports = mongoose.model("PasswordReset", schema);