const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const db = require("../db");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// ===============================
// ACTIVAR MFA (generar QR)
// ===============================
router.post("/activar", auth, async (req, res) => {
    try {
        // Generar secreto
        const secret = speakeasy.generateSecret({
            name: `Refugio Animales (${req.usuario.email})`
        });

        // Guardar secreto en la base de datos
        db.query(
            "UPDATE usuarios SET secret_mfa = ? WHERE id = ?",
            [secret.base32, req.usuario.id],
            async (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Error al guardar secreto" });
                }

                // Generar código QR
                const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
                
                res.json({
                    mensaje: "Escanea el código QR con Google Authenticator",
                    qrCode: qrCodeUrl,
                    secret: secret.base32
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al activar MFA" });
    }
});

// ===============================
// VERIFICAR Y ACTIVAR MFA
// ===============================
router.post("/verificar-activar", auth, (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Código requerido" });
    }

    db.query(
        "SELECT secret_mfa FROM usuarios WHERE id = ?",
        [req.usuario.id],
        (err, result) => {
            if (err || result.length === 0) {
                return res.status(500).json({ error: "Usuario no encontrado" });
            }

            const secret = result[0].secret_mfa;

            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: 1
            });

            if (verified) {
                db.query(
                    "UPDATE usuarios SET mfa_activado = TRUE WHERE id = ?",
                    [req.usuario.id],
                    (err2) => {
                        if (err2) {
                            return res.status(500).json({ error: "Error al activar" });
                        }
                        res.json({ mensaje: "MFA activado correctamente" });
                    }
                );
            } else {
                res.status(400).json({ error: "Código incorrecto" });
            }
        }
    );
});

// ===============================
// VERIFICAR MFA EN LOGIN
// ===============================
router.post("/verificar", auth, (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Código requerido" });
    }

    db.query(
        "SELECT secret_mfa, mfa_activado FROM usuarios WHERE id = ?",
        [req.usuario.id],
        (err, result) => {
            if (err || result.length === 0) {
                return res.status(500).json({ error: "Usuario no encontrado" });
            }

            const usuario = result[0];

            if (!usuario.mfa_activado) {
                return res.json({ message: "MFA no activado" });
            }

            const verified = speakeasy.totp.verify({
                secret: usuario.secret_mfa,
                encoding: 'base32',
                token: token,
                window: 1
            });

            if (verified) {
                res.json({ message: "MFA correcto" });
            } else {
                res.status(400).json({ error: "Código incorrecto" });
            }
        }
    );

    // Verificar si el usuario tiene MFA activado
router.get("/status", auth, (req, res) => {
    db.query(
        "SELECT mfa_activado FROM usuarios WHERE id = ?",
        [req.usuario.id],
        (err, result) => {
            if (err || result.length === 0) {
                return res.status(500).json({ error: "Error" });
            }
            res.json({ activado: result[0].mfa_activado === 1 });
        }
    );
});
});

module.exports = router;