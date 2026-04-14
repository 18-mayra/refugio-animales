// utils/mailer.js - Gmail con App Password
require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("📧 Inicializando mailer...");
console.log("   EMAIL_USER:", process.env.EMAIL_USER);
console.log("   EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Configurada (longitud: " + process.env.EMAIL_PASS.length + ")" : "❌ No configurada");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Error de conexión con Gmail:", error.message);
    } else {
        console.log("✅ Conexión con Gmail establecida");
    }
});

const enviarCorreo = async (para, asunto, texto) => {
    console.log("📧 enviarCorreo() llamada a:", para);
    
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