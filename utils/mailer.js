// utils/mailer.js - Envío de correos con Gmail
require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("📧 Configuración de correo:");
console.log("   EMAIL_USER:", process.env.EMAIL_USER);
console.log("   EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Configurada (longitud: " + process.env.EMAIL_PASS.length + ")" : "❌ No configurada");

// Configuración para Gmail
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verificar conexión
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Error de conexión con Gmail:", error.message);
    } else {
        console.log("✅ Conexión con Gmail establecida correctamente");
    }
});

// Función para enviar correo
async function enviarCorreo(para, asunto, texto) {
    console.log(`📧 Intentando enviar correo a: ${para}`);
    
    try {
        const info = await transporter.sendMail({
            from: `"Refugio de Animales 🐾" <${process.env.EMAIL_USER}>`,
            to: para,
            subject: asunto,
            text: texto
        });
        
        console.log("✅ Correo enviado exitosamente!");
        console.log("   Message ID:", info.messageId);
        return true;
        
    } catch (error) {
        console.error("❌ Error al enviar correo:");
        console.error("   Código:", error.code);
        console.error("   Mensaje:", error.message);
        return false;
    }
}

// Exportar la función correctamente
module.exports = enviarCorreo;  