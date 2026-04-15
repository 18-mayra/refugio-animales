// controllers/passwordController.js

const crypto = require("crypto");
const db = require("../db");
const enviarCorreo = require("../utils/mailer");

// Solicitar recuperación de contraseña
exports.requestReset = async (req, res) => {
    const { email } = req.body;
    const API_BASE_URL = process.env.FRONTEND_URL || "https://refugio-animales.onrender.com";

    if (!email) {
        return res.status(400).json({ error: "El email es requerido" });
    }

    try {
        // Verificar si el usuario existe
        db.query("SELECT id, nombre, email FROM usuarios WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("Error en BD:", err);
                return res.status(500).json({ error: "Error del servidor" });
            }

            if (results.length === 0) {
                // Por seguridad, no revelar si el email existe o no
                return res.json({ message: "Si el email existe, recibirás un enlace de recuperación" });
            }

            const user = results[0];
            
            // Generar token único
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            // Guardar token en la base de datos
            db.query(
                "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
                [user.id, token, expiresAt],
                async (err2) => {
                    if (err2) {
                        console.error("Error guardando token:", err2);
                        return res.status(500).json({ error: "Error al generar recuperación" });
                    }

                    // Enviar email con Brevo
                    const resetLink = `${API_BASE_URL}/reset-password.html?token=${token}`;
                    const htmlEmail = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <h2 style="color: #4CAF50;">🐾 Refugio de Animales</h2>
                            <h3>🔐 Recuperación de contraseña</h3>
                            <p>Hola <strong>${user.nombre}</strong>,</p>
                            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                            <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 25px; border-radius: 30px; text-decoration: none; display: inline-block;">
                                    🔐 Restablecer contraseña
                                </a>
                            </div>
                            <p>Este enlace expirará en <strong>1 hora</strong>.</p>
                            <p>Si no solicitaste este cambio, ignora este mensaje.</p>
                            <hr>
                            <p style="font-size: 12px; color: #666;">Refugio de Animales 🐾</p>
                        </div>
                    `;

                    const resultado = await enviarCorreo(
                        user.email,
                        "🔐 Recuperación de contraseña",
                        `Restablece tu contraseña: ${resetLink}`,
                        htmlEmail
                    );

                    if (resultado.success) {
                        console.log("📧 Email de recuperación enviado a:", user.email);
                        res.json({ message: "Si el email existe, recibirás un enlace de recuperación" });
                    } else {
                        console.error("Error enviando email:", resultado.error);
                        res.status(500).json({ error: "Error al enviar el email" });
                    }
                }
            );
        });
    } catch (error) {
        console.error("Error en requestReset:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
};

// Restablecer contraseña
exports.resetPassword = async (req, res) => {
    const { token, nuevaPassword } = req.body;
    const bcrypt = require("bcrypt");

    if (!token || !nuevaPassword) {
        return res.status(400).json({ error: "Token y nueva contraseña requeridos" });
    }

    if (nuevaPassword.length < 6) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    try {
        // Verificar token
        db.query(
            "SELECT user_id, email FROM password_resets WHERE token = ? AND expires_at > NOW()",
            [token],
            async (err, results) => {
                if (err) {
                    console.error("Error en BD:", err);
                    return res.status(500).json({ error: "Error del servidor" });
                }

                if (results.length === 0) {
                    return res.status(400).json({ error: "Token inválido o expirado" });
                }

                const userId = results[0].user_id;
                const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

                // Actualizar contraseña
                db.query(
                    "UPDATE usuarios SET password = ? WHERE id = ?",
                    [hashedPassword, userId],
                    async (err2) => {
                        if (err2) {
                            console.error("Error actualizando contraseña:", err2);
                            return res.status(500).json({ error: "Error al actualizar" });
                        }

                        // Eliminar token usado
                        db.query("DELETE FROM password_resets WHERE token = ?", [token]);

                        // Enviar confirmación
                        await enviarCorreo(
                            results[0].email,
                            "✅ Contraseña actualizada",
                            "Tu contraseña ha sido actualizada correctamente. Si no realizaste este cambio, contacta con soporte inmediatamente."
                        );

                        res.json({ message: "Contraseña actualizada correctamente" });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
};