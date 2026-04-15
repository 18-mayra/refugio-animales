const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const db = require("../db");

// Generar código MFA (visible en pantalla)
router.post("/send", auth, (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000);
    const expires = new Date(Date.now() + 5 * 60000);

    console.log("🔥 CÓDIGO MFA GENERADO:", code);

    // Guardar código en la base de datos
    db.query(
        "INSERT INTO mfa_codes (user_id, code, expires_at) VALUES (?, ?, ?)",
        [req.usuario.id, code, expires],
        (err) => {
            if (err) {
                console.error("Error guardando código:", err);
                return res.status(500).json({ error: "Error al generar código" });
            }

            // Devolver el código para mostrarlo en pantalla
            res.json({ 
                message: "Código generado",
                debug: code 
            });
        }
    );
});

// Verificar código MFA
router.post("/verify", auth, (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Código requerido" });
    }

    db.query(
        "SELECT * FROM mfa_codes WHERE user_id = ? AND code = ? ORDER BY id DESC LIMIT 1",
        [req.usuario.id, code],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error del servidor" });
            }

            if (result.length === 0) {
                return res.status(400).json({ error: "Código incorrecto" });
            }

            const registro = result[0];

            if (new Date(registro.expires_at) < new Date()) {
                return res.status(400).json({ error: "Código expirado" });
            }

            db.query("DELETE FROM mfa_codes WHERE id = ?", [registro.id]);

            res.json({ message: "MFA correcto" });
        }
    );
});

module.exports = router;