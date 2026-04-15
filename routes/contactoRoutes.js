// routes/contactoRoutes.js - Formulario de contacto
const express = require("express");
const router = express.Router();
const db = require("../db");
const enviarCorreo = require("../utils/mailer");

// ===============================
// ENVIAR MENSAJE DE CONTACTO
// ===============================
router.post("/", async (req, res) => {
    const { nombre, email, telefono, mensaje } = req.body;

    console.log("📧 Nuevo mensaje de contacto:");
    console.log("   Nombre:", nombre);
    console.log("   Email:", email);
    console.log("   Teléfono:", telefono);
    console.log("   Mensaje:", mensaje);

    if (!nombre || !email || !mensaje) {
        return res.status(400).json({ error: "Nombre, email y mensaje son requeridos" });
    }

    try {
        // Guardar en base de datos
        const sql = "INSERT INTO contactos (nombre, email, telefono, mensaje, fecha) VALUES (?, ?, ?, ?, NOW())";
        db.query(sql, [nombre, email, telefono || null, mensaje], (err) => {
            if (err) console.error("Error guardando en BD:", err);
        });

        // 📧 1. Enviar correo al ADMIN (TI)
        const adminEmail = process.env.EMAIL_USER || "psgm.3112@gmail.com";
        const asuntoAdmin = `📧 Nuevo mensaje de contacto de ${nombre}`;
        
        const htmlAdmin = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4CAF50;">📬 NUEVO MENSAJE DE CONTACTO</h2>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
                    <p><strong>👤 Nombre:</strong> ${nombre}</p>
                    <p><strong>📧 Email:</strong> ${email}</p>
                    <p><strong>📱 Teléfono:</strong> ${telefono || "No especificado"}</p>
                    <p><strong>💬 Mensaje:</strong></p>
                    <p style="background-color: white; padding: 10px; border-radius: 5px;">${mensaje}</p>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">📅 Fecha: ${new Date().toLocaleString()}</p>
                <hr>
                <p style="font-size: 12px;">Refugio de Animales - Sistema de contacto</p>
            </div>
        `;
        
        const resultadoAdmin = await enviarCorreo(adminEmail, asuntoAdmin, `Nuevo mensaje de ${nombre}`, htmlAdmin);
        
        // 📧 2. Enviar confirmación al USUARIO
        const asuntoUsuario = "✅ Hemos recibido tu mensaje - Refugio de Animales";
        const htmlUsuario = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4CAF50;">✅ ¡Mensaje recibido!</h2>
                <p>Hola <strong>${nombre}</strong>,</p>
                <p>Gracias por contactarnos. Hemos recibido tu mensaje y nos pondremos en contacto contigo pronto.</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p><strong>📝 Tu mensaje:</strong></p>
                    <p>"${mensaje}"</p>
                </div>
                <hr>
                <p style="font-size: 12px; color: #666;">🐾 Refugio de Animales - Amor sin condiciones</p>
            </div>
        `;
        
        const resultadoUsuario = await enviarCorreo(email, asuntoUsuario, `Hemos recibido tu mensaje`, htmlUsuario);

        if (!resultadoAdmin.success) {
            console.error("❌ Error al enviar a admin:", resultadoAdmin.error);
        }
        
        if (!resultadoUsuario.success) {
            console.error("❌ Error al enviar al usuario:", resultadoUsuario.error);
        }

        res.json({ 
            mensaje: "Mensaje enviado correctamente. Te contactaremos pronto.",
            adminNotificado: resultadoAdmin.success,
            usuarioNotificado: resultadoUsuario.success
        });

    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({ error: "Error al enviar el mensaje. Intenta más tarde." });
    }
});

module.exports = router;