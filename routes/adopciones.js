const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const auditoria = require("../middlewares/auditoria");
const enviarCorreo = require("../utils/mailer");

// ===============================
// 📝 CREAR SOLICITUD
// ===============================
router.post("/", auth, auditoria, async (req, res) => {
    try {
        const {
            animal_id,
            nombre,
            email,
            telefono,
            direccion,
            mensaje,
            tieneMascotas,
            tipoVivienda
        } = req.body;

        const usuario_id = req.usuario.id;

        if (!animal_id || !nombre || !email || !telefono) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        db.query(
            "SELECT estado, nombre FROM animales WHERE id = ?",
            [animal_id],
            (err, animal) => {
                if (err) return res.status(500).json({ error: "Error DB" });

                if (animal.length === 0) {
                    return res.status(404).json({ error: "Animal no existe" });
                }

                if (animal[0].estado !== "Disponible") {
                    return res.status(400).json({ error: "No disponible" });
                }

                db.query(
                    `INSERT INTO adopciones 
                    (usuario_id, animal_id, nombre, email, telefono, direccion, mensaje, tiene_mascotas, tipo_vivienda, estado, fecha_solicitud) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
                    [
                        usuario_id,
                        animal_id,
                        nombre,
                        email,
                        telefono,
                        direccion || null,
                        mensaje || null,
                        tieneMascotas || "no",
                        tipoVivienda || "casa"
                    ],
                    async (err2, result) => {
                        if (err2) {
                            console.error(err2);
                            return res.status(500).json({ error: "Error al guardar" });
                        }

                        // 📧 EMAIL USUARIO
                        try {
                            await enviarCorreo(
                                email,
                                "📋 Solicitud recibida",
                                `Solicitud para ${animal[0].nombre}`,
                                `<h3>Solicitud recibida para ${animal[0].nombre}</h3>`
                            );
                        } catch (e) {
                            console.error("Error email usuario:", e);
                        }

                        // 📧 EMAIL ADMIN
                        try {
                            await enviarCorreo(
                                process.env.EMAIL_USER,
                                "Nueva solicitud",
                                `Animal: ${animal[0].nombre}`
                            );
                        } catch (e) {
                            console.error("Error email admin:", e);
                        }

                        res.json({
                            mensaje: "Solicitud enviada",
                            id: result.insertId
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error servidor" });
    }
});

// ===============================
// 📋 MIS SOLICITUDES
// ===============================
router.get("/mis-solicitudes", auth, (req, res) => {
    const usuario_id = req.usuario.id;

    db.query(
        `SELECT a.*, ani.nombre as animal_nombre
         FROM adopciones a
         JOIN animales ani ON a.animal_id = ani.id
         WHERE a.usuario_id = ?`,
        [usuario_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Error" });
            res.json(results);
        }
    );
});

// ===============================
// 👑 TODAS (ADMIN)
// ===============================
router.get("/", auth, role("admin", "superadmin"), (req, res) => {
    db.query(
        `SELECT a.*, u.nombre as usuario_nombre, ani.nombre as animal_nombre
         FROM adopciones a
         JOIN usuarios u ON a.usuario_id = u.id
         JOIN animales ani ON a.animal_id = ani.id`,
        (err, results) => {
            if (err) return res.status(500).json({ error: "Error" });
            res.json(results);
        }
    );
});

// ===============================
// ✅ APROBAR
// ===============================
router.put("/aprobar/:id", auth, role("admin", "superadmin"), (req, res) => {
    const id = req.params.id;

    db.query("UPDATE adopciones SET estado='aprobado' WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Error" });

        res.json({ mensaje: "Aprobado" });
    });
});

// ===============================
// ❌ RECHAZAR
// ===============================
router.put("/rechazar/:id", auth, role("admin", "superadmin"), (req, res) => {
    const id = req.params.id;

    db.query("UPDATE adopciones SET estado='rechazado' WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Error" });

        res.json({ mensaje: "Rechazado" });
    });
});

module.exports = router;