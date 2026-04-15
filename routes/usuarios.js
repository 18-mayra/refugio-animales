const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const auditoria = require("../middlewares/auditoria");
const enviarCorreo = require("../utils/mailer");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const { loginLimiter } = require("../middlewares/rateLimit");
const { body, validationResult } = require("express-validator");

const SECRET = process.env.JWT_SECRET || "mi_clave_super_secreta";

// ===============================
// REGISTRO
// ===============================
router.post("/registro", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, 'usuario', 1)",
      [nombre, email, hashedPassword],
      async (err) => {
        if (err) return res.status(500).json({ mensaje: "Error registro" });
        
        try {
          const htmlBienvenida = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #4CAF50;">🐾 ¡Bienvenido al Refugio de Animales, ${nombre}!</h2>
              <p>Gracias por unirte a nuestra comunidad.</p>
              <p>Ahora puedes:</p>
              <ul>
                <li>✅ Ver animales disponibles para adopción</li>
                <li>✅ Dar seguimiento a tus solicitudes</li>
                <li>✅ Recibir notificaciones de nuevos animales</li>
              </ul>
              <p>¡Juntos podemos darles un hogar a muchos animalitos!</p>
              <hr>
              <p style="font-size: 12px; color: #666;">Refugio de Animales - Amor sin condiciones</p>
            </div>
          `;
          
          await enviarCorreo(email, "🐾 ¡Bienvenido al Refugio de Animales!", `Hola ${nombre}, gracias por registrarte.`, htmlBienvenida);
          console.log("📧 Email de bienvenida enviado a:", email);
        } catch (emailError) {
          console.error("Error enviando email de bienvenida:", emailError);
        }
        
        res.json({ mensaje: "Usuario registrado correctamente" });
      }
    );
  } catch {
    res.status(500).json({ mensaje: "Error servidor" });
  }
});

// ===============================
// ENVIAR CÓDIGO DE VERIFICACIÓN (PASO 1)
// ===============================
router.post(
  "/login/enviar-codigo",
  loginLimiter,
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 4 }).withMessage("Password muy corto"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error servidor" });
      }
      
      if (result.length === 0) {
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }

      const usuario = result[0];
      
      if (usuario.activo === 0) {
        return res.status(403).json({ mensaje: "Usuario bloqueado" });
      }

      const match = await bcrypt.compare(password, usuario.password);
      if (!match) {
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }

      // Eliminar códigos anteriores no usados
      db.query("DELETE FROM codigos_verificacion WHERE user_id = ? AND usado = FALSE", [usuario.id]);

      // Generar código de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Guardar código en la base de datos
      db.query(
        "INSERT INTO codigos_verificacion (user_id, codigo, expires_at) VALUES (?, ?, ?)",
        [usuario.id, codigo, expires],
        async (err2) => {
          if (err2) {
            console.error("Error guardando código:", err2);
            return res.status(500).json({ error: "Error al generar código" });
          }

          // Enviar email con el código
          const htmlCodigo = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #4CAF50;">🔐 Código de verificación</h2>
              <p>Hola <strong>${usuario.nombre}</strong>,</p>
              <p>Recibimos una solicitud para iniciar sesión en tu cuenta.</p>
              <p>Tu código de acceso es:</p>
              <div style="background-color: #f4f4f4; padding: 20px; font-size: 32px; text-align: center; letter-spacing: 5px; border-radius: 5px;">
                <strong style="color: #4CAF50;">${codigo}</strong>
              </div>
              <p>Este código expira en <strong>10 minutos</strong>.</p>
              <p><strong>⚠️ No compartas este código con nadie.</strong></p>
              <p>Si no intentaste iniciar sesión, ignora este mensaje.</p>
              <hr>
              <p style="font-size: 12px; color: #666;">Refugio de Animales 🐾</p>
            </div>
          `;

          const textoPlano = `
🔐 CÓDIGO DE VERIFICACIÓN

Hola ${usuario.nombre},

Tu código de acceso es: ${codigo}

Este código expira en 10 minutos.

No compartas este código con nadie.

Refugio de Animales 🐾
          `;

          console.log("📧 Enviando código a:", email);
          console.log("🔑 CÓDIGO:", codigo);
          
          const resultado = await enviarCorreo(email, "🔐 Código de verificación", textoPlano, htmlCodigo);
          
          if (resultado.success) {
            console.log("✅ Código enviado exitosamente a:", email);
            res.json({ 
              mensaje: "Código enviado a tu correo",
              userId: usuario.id,
              expira: expires
            });
          } else {
            console.error("❌ Error al enviar email:", resultado.error);
            res.status(500).json({ error: "Error al enviar el código por email" });
          }
        }
      );
    });
  }
);

// ===============================
// VERIFICAR CÓDIGO Y COMPLETAR LOGIN (PASO 2)
// ===============================
router.post("/login/verificar-codigo", async (req, res) => {
  const { userId, codigo } = req.body;

  if (!userId || !codigo) {
    return res.status(400).json({ error: "Código requerido" });
  }

  db.query(
    `SELECT * FROM codigos_verificacion 
     WHERE user_id = ? AND codigo = ? AND expires_at > NOW() AND usado = FALSE`,
    [userId, codigo],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ error: "Código inválido o expirado" });
      }

      // Marcar código como usado
      db.query("UPDATE codigos_verificacion SET usado = TRUE WHERE id = ?", [result[0].id]);

      // Obtener datos del usuario
      db.query("SELECT * FROM usuarios WHERE id = ?", [userId], async (err, userResult) => {
        if (err || userResult.length === 0) {
          return res.status(500).json({ error: "Error al obtener usuario" });
        }

        const usuario = userResult[0];

        // Limpiar tokens antiguos
        db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [usuario.id]);
        db.query("DELETE FROM sesiones WHERE user_id = ?", [usuario.id]);

        // Generar ACCESS TOKEN (24 horas)
        const accessToken = jwt.sign(
          { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre, email: usuario.email },
          SECRET,
          { expiresIn: "24h" }
        );

        // Generar REFRESH TOKEN (30 días)
        const refreshToken = jwt.sign(
          { id: usuario.id },
          SECRET,
          { expiresIn: "30d" }
        );

        // Guardar tokens
        db.query(
          "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))",
          [usuario.id, refreshToken]
        );

        db.query(
          "INSERT INTO sesiones (user_id, token, ip, user_agent) VALUES (?, ?, ?, ?)",
          [usuario.id, accessToken, req.ip || "0.0.0.0", req.headers["user-agent"] || "unknown"],
          (err) => {
            if (err) {
              console.error("Error guardando sesión:", err);
              return res.status(500).json({ error: "Error al iniciar sesión" });
            }

            // Enviar notificación de inicio de sesión
            const htmlNotificacion = `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #4CAF50;">✅ Nuevo inicio de sesión</h2>
                <p>Hola <strong>${usuario.nombre}</strong>,</p>
                <p>Se ha iniciado sesión en tu cuenta.</p>
                <p><strong>Detalles:</strong></p>
                <ul>
                  <li>📅 Fecha: ${new Date().toLocaleString()}</li>
                  <li>🌐 IP: ${req.ip || "Desconocida"}</li>
                </ul>
                <p>Si no fuiste tú, cambia tu contraseña inmediatamente.</p>
                <hr>
                <p style="font-size: 12px;">Refugio de Animales 🐾</p>
              </div>
            `;
            
            enviarCorreo(usuario.email, "✅ Nuevo inicio de sesión", "Se ha iniciado sesión en tu cuenta", htmlNotificacion);

            res.json({
              success: true,
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
});

// ===============================
// LOGOUT
// ===============================
router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (refreshToken) db.query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
  if (token) db.query("DELETE FROM sesiones WHERE token = ?", [token]);

  res.json({ mensaje: "Logout completo" });
});

// ===============================
// REFRESH TOKEN
// ===============================
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

// ===============================
// VALIDAR TOKEN
// ===============================
router.get("/token/validar", auth, (req, res) => {
  if (!req.usuario) {
    return res.status(401).json({ error: "No autorizado" });
  }
  res.json({ mensaje: "Token válido", usuario: req.usuario });
});

// ===============================
// SESIONES (ADMIN)
// ===============================
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

// ===============================
// BLOQUEAR USUARIO (ADMIN)
// ===============================
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

// ===============================
// LISTAR USUARIOS (ADMIN)
// ===============================
router.get("/todos", auth, role("admin"), (req, res) => {
  db.query("SELECT id, nombre, email, activo, rol FROM usuarios", (err, results) => {
    if (err) return res.status(500).json({ mensaje: "Error" });
    res.json(results);
  });
});

module.exports = router;