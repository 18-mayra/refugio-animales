const MfaCode = require("../models/MfaCode");
const { generateOTP } = require("../services/mfaService");

exports.sendCode = async (req, res) => {
    const code = generateOTP();

    await MfaCode.create({
        userId: req.user.id,
        code,
        expiresAt: new Date(Date.now() + 5 * 60000)
    });

    console.log("Código MFA:", code); // simulación SMS/email

    res.json({ message: "Código enviado" });
};

exports.verifyCode = async (req, res) => {
    const { code } = req.body;

    const record = await MfaCode.findOne({
        userId: req.user.id,
        code
    });

    if (!record) return res.status(400).json({ error: "Código inválido" });

    if (record.expiresAt < new Date()) {
        return res.status(400).json({ error: "Código expirado" });
    }

    res.json({ message: "MFA correcto" });
};