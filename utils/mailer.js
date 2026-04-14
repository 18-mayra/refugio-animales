// utils/mailer.js - Gmail con App Password
require("dotenv").config();
const nodemailer = require("nodemailer");

// Configurar transporte de Gmail
const transporter = nodemailer.createTransport({
    service: "gmail",
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
        console.log("✅ Conexión con Gmail establecida");
    }
});

/**
 * Envía un correo electrónico
 * @param {string} para - Correo del destinatario
 * @param {string} asunto - Asunto del correo
 * @param {string} texto - Cuerpo del correo
 * @returns {Promise<boolean>} - true si se envió, false si hubo error
 */
const enviarCorreo = async (para, asunto, texto) => {
    try {
        const info = await transporter.sendMail({
            from: `"Refugio de Animales 🐾" <${process.env.EMAIL_USER}>`,
            to: para,
            subject: asunto,
            text: texto,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; background: linear-gradient(135deg, #667eea, #764ba2); padding: 15px; border-radius: 10px 10px 0 0;">
                        <h2 style="color: white; margin: 0;">🐾 Refugio de Animales</h2>
                    </div>
                    <div style="padding: 20px;">
                        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${texto}</pre>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f5f5f5; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
                        <p>Este es un mensaje automático. Por favor no responder a este correo.</p>
                        <p>© 2026 Refugio de Animales</p>
                    </div>
                </div>
            `
        });
        
        console.log("✅ Correo enviado a:", para);
        console.log("   Message ID:", info.messageId);
        return true;
        
    } catch (error) {
        console.error("❌ Error enviando correo a:", para);
        console.error("   Error:", error.message);
        return false;
    }
};

module.exports = enviarCorreo;