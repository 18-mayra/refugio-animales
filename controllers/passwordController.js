const crypto = require("crypto");
const PasswordReset = require("../models/PasswordReset");

exports.requestReset = async (req, res) => {
    const token = crypto.randomBytes(20).toString("hex");

    await PasswordReset.create({
        userId: req.body.userId,
        token,
        expiresAt: new Date(Date.now() + 15 * 60000)
    });

    console.log("Link:", `http://localhost:3000/reset/${token}`);

    res.json({ message: "Correo enviado" });
};