// routes/passwordRoutes.js - Recuperación de contraseña con código de 6 dígitos
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const enviarCorreo = require("../utils/mailer");

// Generar código de 6 dígitos
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===============================
// ENVIAR CÓDIGO DE RECUPERACIÓN
// ===============================
router.post("/recuperar", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email requerido" });
    }

    db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error del servidor" });
        }

        if (result.length === 0) {
            // Por seguridad, decimos que se envió aunque no exista
            return res.json({ message: "Si el email existe, recibirás un código de recuperación" });
        }

        const user = result[0];
        const codigo = generarCodigo();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Eliminar códigos anteriores
        db.query("DELETE FROM password_resets WHERE user_id = ?", [user.id]);

        db.query(
            "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
            [user.id, codigo, expires],
            async (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ message: "Error del servidor" });
                }

                // 📧 Enviar código por EMAIL al usuario
                const htmlMensaje = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #4CAF50;">🐾 Refugio de Animales</h2>
                        <h3>🔐 Recuperación de contraseña</h3>
                        <p>Hola <strong>${user.nombre || user.email}</strong>,</p>
                        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                        <p>Tu código de verificación es:</p>
                        <div style="background-color: #f4f4f4; padding: 15px; font-size: 32px; text-align: center; letter-spacing: 5px; border-radius: 5px;">
                            <strong style="color: #4CAF50;">${codigo}</strong>
                        </div>
                        <p>Este código expira en <strong>15 minutos</strong>.</p>
                        <p>Si no solicitaste esto, ignora este mensaje.</p>
                        <hr>
                        <p style="font-size: 12px; color: #666;">Refugio de Animales 🐾</p>
                    </div>
                `;

                const resultado = await enviarCorreo(user.email, "🔐 Código de recuperación", `Tu código es: ${codigo}`, htmlMensaje);
                
                if (resultado.success) {
                    console.log("📧 Código de recuperación enviado a:", user.email);
                    res.json({ 
                        message: "Revisa tu correo, recibirás un código de 6 dígitos",
                        userId: user.id
                    });
                } else {
                    console.error("❌ Error al enviar email:", resultado.error);
                    res.status(500).json({ message: "Error al enviar el código. Intenta nuevamente." });
                }
            }
        );
    });
});

// ===============================
// VERIFICAR CÓDIGO Y RESTABLECER CONTRASEÑA
// ===============================
router.post("/reset", async (req, res) => {
    const { userId, codigo, password } = req.body;

    if (!userId || !codigo || !password) {
        return res.status(400).json({ message: "Código y contraseña requeridos" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    db.query(
        "SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND expires_at > NOW()",
        [userId, codigo],
        async (err, result) => {
            if (err || result.length === 0) {
                return res.status(400).json({ message: "Código inválido o expirado" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                "UPDATE usuarios SET password = ? WHERE id = ?",
                [hashedPassword, userId],
                async (err2) => {
                    if (err2) {
                        return res.status(500).json({ message: "Error actualizando contraseña" });
                    }

                    // Eliminar código usado
                    db.query("DELETE FROM password_resets WHERE user_id = ?", [userId]);

                    // Enviar confirmación por email
                    const htmlConfirmacion = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px;">
                            <h2 style="color: #4CAF50;">✅ Contraseña actualizada</h2>
                            <p>Tu contraseña ha sido actualizada correctamente.</p>
                            <p>Si no realizaste este cambio, contacta con soporte inmediatamente.</p>
                            <hr>
                            <p>Refugio de Animales 🐾</p>
                        </div>
                    `;
                    
                    db.query("SELECT email FROM usuarios WHERE id = ?", [userId], (err3, userResult) => {
                        if (!err3 && userResult.length > 0) {
                            enviarCorreo(userResult[0].email, "✅ Contraseña actualizada", "Tu contraseña ha sido actualizada", htmlConfirmacion);
                        }
                    });

                    res.json({ message: "Contraseña actualizada correctamente" });
                }
            );
        }
    );
});

module.exports = router;