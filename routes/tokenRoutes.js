const router = require("express").Router();
const jwt = require("jsonwebtoken");
const db = require("../db");

const ACCESS_SECRET = "mi_clave_super_secreta";
const REFRESH_SECRET = "refresh_secret";

// 🔁 REFRESH TOKEN
router.post("/refresh", (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "No token" });
  }

  jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {

    if (err) return res.status(403).json({ error: "Token inválido" });

    db.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [refreshToken],
      (err, result) => {

        if (result.length === 0) {
          return res.status(403).json({ error: "Token no válido" });
        }

        const newAccessToken = jwt.sign(
          { id: user.id, role: user.role },
          ACCESS_SECRET,
          { expiresIn: "15m" }
        );

        res.json({ accessToken: newAccessToken });
      }
    );
  });
});

// 🔍 VALIDAR TOKEN (MEJORADO)
router.get("/validar", (req, res) => {

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, ACCESS_SECRET, (err, user) => {

    if (err) {
      return res.status(403).json({ error: "Token inválido" });
    }

    // 🔥 VALIDAR SESIÓN EN BD
    db.query(
      "SELECT * FROM sesiones WHERE token = ?",
      [token],
      (err, result) => {

        if (result.length === 0) {
          return res.status(403).json({ error: "Sesión no válida" });
        }

        res.json({
          mensaje: "Token válido",
          usuario: user
        });
      }
    );

  });

});

module.exports = router;