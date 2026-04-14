// utils/mailer.js
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Error de conexión con Gmail:", error.message);
    } else {
        console.log("✅ Conexión con Gmail establecida");
    }
});

const enviarCorreo = async (para, asunto, texto) => {
    try {
        const info = await transporter.sendMail({
            from: `"Refugio de Animales 🐾" <${process.env.EMAIL_USER}>`,
            to: para,
            subject: asunto,
            text: texto
        });
        console.log("✅ Correo enviado a:", para);
        return true;
    } catch (error) {
        console.error("❌ Error:", error.message);
        return false;
    }
};

module.exports = enviarCorreo;