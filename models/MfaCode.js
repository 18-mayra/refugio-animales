const mongoose = require("mongoose");

const mfaSchema = new mongoose.Schema({
    userId: String,
    code: String,
    expiresAt: Date
});

module.exports = mongoose.model("MfaCode", mfaSchema);