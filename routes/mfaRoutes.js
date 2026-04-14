const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const db = require("../db");
const enviarCorreo = require("../utils/mailer");

// =========================
// ENVIAR CÓDIGO MFA
// =========================
router.post("/send", auth, async (req, res) => {
    console.log("🔥 MFA - Enviando código para usuario:", req.usuario.id);
    
    const code = Math.floor(100000 + Math.random() * 900000);
    const expires = new Date(Date.now() + 5 * 60000);

    console.log("🔥 CÓDIGO MFA GENERADO:", code);

    db.query(
        "SELECT email FROM usuarios WHERE id = ?",
        [req.usuario.id],
        async (err, result) => {
            if (err || result.length === 0) {
                console.error("❌ Usuario no encontrado:", err);
                return res.status(500).json({ error: "Usuario no encontrado" });
            }

            const usuario = result[0];
            console.log("📧 Enviando a:", usuario.email);

            db.query(
                "INSERT INTO mfa_codes (user_id, code, expires_at) VALUES (?, ?, ?)",
                [req.usuario.id, code, expires],
                async (err2) => {
                    if (err2) {
                        console.error("❌ Error guardando código:", err2);
                        return res.status(500).json({ error: "Error guardando código" });
                    }

                    try {
                        await enviarCorreo(
                            usuario.email,
                            "🔐 Código de verificación - Refugio",
                            `Tu código MFA es: ${code}\n\nExpira en 5 minutos.`
                        );
                        console.log("✅ Correo enviado a:", usuario.email);
                    } catch (emailError) {
                        console.error("❌ Error enviando correo:", emailError);
                    }

                    res.json({ 
                        message: "Código enviado al correo",
                        debug: code 
                    });
                }
            );
        }
    );
});

// =========================
// VERIFICAR CÓDIGO MFA
// =========================
router.post("/verify", auth, (req, res) => {
    console.log("🔍 Verificando código MFA para usuario:", req.usuario.id);
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Código requerido" });
    }

    db.query(
        "SELECT * FROM mfa_codes WHERE user_id = ? AND code = ? ORDER BY id DESC LIMIT 1",
        [req.usuario.id, code],
        (err, result) => {
            if (err) {
                console.error("Error verificando MFA:", err);
                return res.status(500).json({ error: "Error del servidor" });
            }

            if (result.length === 0) {
                console.log("❌ Código incorrecto para usuario:", req.usuario.id);
                return res.status(400).json({ error: "Código incorrecto" });
            }

            const registro = result[0];

            if (new Date(registro.expires_at) < new Date()) {
                console.log("❌ Código expirado");
                return res.status(400).json({ error: "Código expirado" });
            }

            db.query("DELETE FROM mfa_codes WHERE id = ?", [registro.id]);
            console.log("✅ MFA verificado correctamente para usuario:", req.usuario.id);

            res.json({ message: "MFA correcto" });
        }
    );
});

module.exports = router;