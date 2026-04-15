const express = require("express");
const router = express.Router();
const db = require("../db");

// 🔐 MIDDLEWARES
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

/* =========================
   VER TODAS LAS SESIONES (ADMIN)
========================= */
router.get("/", auth, role(["admin"]), (req, res) => {

  const sql = `
    SELECT sesiones.id, sesiones.ip, sesiones.user_agent, sesiones.created_at,
           usuarios.nombre, usuarios.email
    FROM sesiones
    JOIN usuarios ON sesiones.user_id = usuarios.id
    ORDER BY sesiones.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al obtener sesiones" });
    }

    res.json(result);
  });

});


/* =========================
   VER MIS SESIONES (USUARIO)
========================= */
router.get("/mis-sesiones", auth, (req, res) => {

  db.query(
    "SELECT * FROM sesiones WHERE user_id = ?",
    [req.usuario.id],
    (err, result) => {

      if (err) {
        return res.status(500).json({ error: "Error al obtener sesiones" });
      }

      res.json(result);
    }
  );

});


/* =========================
   CERRAR SESIÓN (ADMIN)
========================= */
router.delete("/:id", auth, role(["admin"]), (req, res) => {

  const sessionId = req.params.id;

  db.query(
    "DELETE FROM sesiones WHERE id = ?",
    [sessionId],
    (err) => {

      if (err) {
        return res.status(500).json({ error: "Error al eliminar sesión" });
      }

      res.json({ mensaje: "Sesión cerrada correctamente" });
    }
  );

});


/* =========================
   CERRAR MI SESIÓN (USUARIO)
========================= */
router.delete("/cerrar/mia/:id", auth, (req, res) => {

  const sessionId = req.params.id;

  db.query(
    "DELETE FROM sesiones WHERE id = ? AND user_id = ?",
    [sessionId, req.usuario.id],
    (err) => {

      if (err) {
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }

      res.json({ mensaje: "Sesión cerrada" });
    }
  );

});

module.exports = router;