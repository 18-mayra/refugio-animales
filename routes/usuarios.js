const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const auditoria = require("../middlewares/auditoria");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const { loginLimiter } = require("../middlewares/rateLimit");
const { body, validationResult } = require("express-validator");

const SECRET = process.env.JWT_SECRET || "mi_clave_super_secreta";

/* ===============================
   REGISTRO
================================ */
router.post("/registro", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, 'usuario', 1)",
      [nombre, email, hashedPassword],
      (err) => {
        if (err) return res.status(500).json({ mensaje: "Error registro" });
        res.json({ mensaje: "Usuario registrado correctamente" });
      }
    );
  } catch {
    res.status(500).json({ mensaje: "Error servidor" });
  }
});

/* ===============================
   LOGIN
================================ */
router.post(
  "/login",
  loginLimiter,
  auditoria,
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 4 }).withMessage("Password muy corto"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error servidor" });
      if (result.length === 0) {
        return res.status(400).json({ mensaje: "Usuario no encontrado" });
      }

      const usuario = result[0];
      if (usuario.activo === 0) {
        return res.status(403).json({ mensaje: "Usuario bloqueado" });
      }

      const match = await bcrypt.compare(password, usuario.password);
      if (!match) {
        return res.status(400).json({ mensaje: "Contraseña incorrecta" });
      }

      // Limpiar tokens antiguos
      db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [usuario.id]);
      db.query("DELETE FROM sesiones WHERE user_id = ?", [usuario.id]);

      // ACCESS TOKEN - 24 HORAS
      const accessToken = jwt.sign(
        { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre, email: usuario.email },
        SECRET,
        { expiresIn: "24h" }
      );

      // REFRESH TOKEN - 30 DÍAS
      const refreshToken = jwt.sign(
        { id: usuario.id },
        SECRET,
        { expiresIn: "30d" }
      );

      db.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))",
        [usuario.id, refreshToken]
      );

      db.query(
        "INSERT INTO sesiones (user_id, token, ip, user_agent) VALUES (?, ?, ?, ?)",
        [usuario.id, accessToken, req.ip, req.headers["user-agent"]],
        (err) => {
          if (err) return res.status(500).json({ mensaje: "Error sesión" });
          res.json({
            accessToken,
            refreshToken,
            usuario: {
              id: usuario.id,
              email: usuario.email,
              rol: usuario.rol,
              nombre: usuario.nombre
            }
          });
        }
      );
    });
  }
);

/* ===============================
   REFRESH TOKEN
================================ */
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ mensaje: "Token requerido" });
  }

  db.query(
    "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
    [refreshToken],
    (err, result) => {
      if (err || result.length === 0) {
        return res.status(403).json({ mensaje: "Refresh inválido o expirado" });
      }

      try {
        const decoded = jwt.verify(refreshToken, SECRET);
        const newAccessToken = jwt.sign(
          { id: decoded.id, rol: decoded.rol || "usuario" },
          SECRET,
          { expiresIn: "24h" }
        );
        res.json({ accessToken: newAccessToken });
      } catch {
        res.status(403).json({ mensaje: "Refresh inválido" });
      }
    }
  );
});

/* ===============================
   LOGOUT
================================ */
router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (refreshToken) db.query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
  if (token) db.query("DELETE FROM sesiones WHERE token = ?", [token]);

  res.json({ mensaje: "Logout completo" });
});

/* ===============================
   VALIDAR TOKEN
================================ */
router.get("/token/validar", auth, (req, res) => {
  if (!req.usuario) {
    return res.status(401).json({ error: "No autorizado" });
  }
  res.json({ mensaje: "Token válido", usuario: req.usuario });
});

/* ===============================
   SESIONES
================================ */
router.get("/sessions", auth, role("admin"), (req, res) => {
  const sql = `
    SELECT sesiones.id, sesiones.ip, sesiones.user_agent,
           usuarios.id AS user_id, usuarios.nombre, usuarios.email, usuarios.activo
    FROM sesiones
    JOIN usuarios ON sesiones.user_id = usuarios.id
    ORDER BY sesiones.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ mensaje: "Error" });
    res.json(results);
  });
});

/* ===============================
   BLOQUEAR USUARIO
================================ */
router.put("/bloquear/:id", auth, role("admin"), (req, res) => {
  const userId = req.params.id;
  db.query("UPDATE usuarios SET activo = 0 WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ mensaje: "Error bloquear" });
    db.query("DELETE FROM sesiones WHERE user_id = ?", [userId], (err) => {
      if (err) return res.status(500).json({ mensaje: "Error sesiones" });
      res.json({ mensaje: "Usuario bloqueado" });
    });
  });
});

/* ===============================
   LISTAR USUARIOS
================================ */
router.get("/todos", auth, role("admin"), (req, res) => {
  db.query("SELECT id, nombre, email, activo, rol FROM usuarios", (err, results) => {
    if (err) return res.status(500).json({ mensaje: "Error" });
    res.json(results);
  });
});

module.exports = router;