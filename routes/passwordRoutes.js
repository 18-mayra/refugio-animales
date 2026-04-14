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
// ENVIAR CÓDIGO DE RECUPERACIÓN (6 DÍGITOS)
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
            return res.json({ message: "Si el email existe, recibirás un código de recuperación" });
        }

        const user = result[0];
        const codigo = generarCodigo();
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        db.query(
            "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
            [user.id, codigo, expires],
            async (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ message: "Error del servidor" });
                }

                const mensaje = `
Hola ${user.nombre || user.email},

Tu código de verificación es: ${codigo}

Este código expira en 15 minutos.

Si no solicitaste esto, ignora este mensaje.

Refugio de Animales 🐾
                `;

                await enviarCorreo(user.email, "Código de recuperación", mensaje);
                console.log("📧 Código enviado a:", user.email);
                console.log("🔑 CÓDIGO:", codigo);

                res.json({ message: "Revisa tu correo, recibirás un código de 6 dígitos" });
            }
        );
    });
});

// ===============================
// RESTABLECER CONTRASEÑA
// ===============================
router.post("/reset", async (req, res) => {
    const { codigo, password } = req.body;

    if (!codigo || !password) {
        return res.status(400).json({ message: "Código y contraseña requeridos" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    db.query(
        "SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()",
        [codigo],
        async (err, result) => {
            if (err || result.length === 0) {
                return res.status(400).json({ message: "Código inválido o expirado" });
            }

            const reset = result[0];
            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                "UPDATE usuarios SET password = ? WHERE id = ?",
                [hashedPassword, reset.user_id],
                (err2) => {
                    if (err2) {
                        return res.status(500).json({ message: "Error actualizando contraseña" });
                    }

                    db.query("DELETE FROM password_resets WHERE token = ?", [codigo]);
                    res.json({ message: "Contraseña actualizada correctamente" });
                }
            );
        }
    );
});

module.exports = router;