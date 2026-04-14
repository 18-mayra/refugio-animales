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
        // Guardar en base de datos (opcional)
        const sql = "INSERT INTO contactos (nombre, email, telefono, mensaje, fecha) VALUES (?, ?, ?, ?, NOW())";
        db.query(sql, [nombre, email, telefono || null, mensaje], (err) => {
            if (err) console.error("Error guardando en BD:", err);
        });

        // Enviar correo al administrador
        const adminEmail = process.env.EMAIL_USER || "psgm.3112@gmail.com";
        const asuntoAdmin = `📧 Nuevo mensaje de contacto de ${nombre}`;
        const textoAdmin = `
📩 NUEVO MENSAJE DE CONTACTO

👤 Nombre: ${nombre}
📧 Email: ${email}
📱 Teléfono: ${telefono || "No especificado"}
💬 Mensaje:
${mensaje}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        
        const resultadoAdmin = await enviarCorreo(adminEmail, asuntoAdmin, textoAdmin);
        console.log("📧 Resultado envío a admin:", resultadoAdmin ? "✅ Éxito" : "❌ Fallo");

        // Enviar confirmación al usuario
        const asuntoUsuario = "✅ Hemos recibido tu mensaje - Refugio de Animales";
        const textoUsuario = `
Hola ${nombre},

Gracias por contactarnos. Hemos recibido tu mensaje y nos pondremos en contacto contigo pronto.

📝 Tu mensaje:
"${mensaje}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐾 Refugio de Animales
📞 (449) 123-4567
📧 refugio@animales.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este es un mensaje automático, por favor no responder.
        `;
        
        const resultadoUsuario = await enviarCorreo(email, asuntoUsuario, textoUsuario);
        console.log("📧 Resultado envío a usuario:", resultadoUsuario ? "✅ Éxito" : "❌ Fallo");

        if (!resultadoAdmin && !resultadoUsuario) {
            return res.status(500).json({ error: "Error al enviar los correos. Intenta más tarde." });
        }

        res.json({ mensaje: "Mensaje enviado correctamente. Te contactaremos pronto." });

    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({ error: "Error al enviar el mensaje. Intenta más tarde." });
    }
});

module.exports = router;