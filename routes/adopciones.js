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
                            const htmlUsuario = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                                    <h2 style="color: #4CAF50;">📋 Solicitud de adopción recibida</h2>
                                    <p>Hola <strong>${nombre}</strong>,</p>
                                    <p>Hemos recibido tu solicitud para adoptar a <strong>${animal[0].nombre}</strong>.</p>
                                    <p>Estado: <strong style="color: orange;">Pendiente de revisión</strong></p>
                                    <p>Te contactaremos pronto.</p>
                                    <hr>
                                    <p>Refugio de Animales 🐾</p>
                                </div>
                            `;
                            await enviarCorreo(
                                email,
                                "📋 Solicitud de adopción recibida",
                                `Hemos recibido tu solicitud para ${animal[0].nombre}`,
                                htmlUsuario
                            );
                        } catch (e) {
                            console.error("Error email usuario:", e);
                        }

                        // 📧 EMAIL ADMIN
                        try {
                            const htmlAdmin = `
                                <div style="font-family: Arial, sans-serif;">
                                    <h2>🆕 Nueva solicitud de adopción</h2>
                                    <p><strong>Animal:</strong> ${animal[0].nombre}</p>
                                    <p><strong>Solicitante:</strong> ${nombre}</p>
                                    <p><strong>Email:</strong> ${email}</p>
                                    <p><strong>Teléfono:</strong> ${telefono}</p>
                                </div>
                            `;
                            await enviarCorreo(
                                process.env.EMAIL_USER || "psgm.3112@gmail.com",
                                "🆕 Nueva solicitud de adopción",
                                `Nueva solicitud para ${animal[0].nombre}`,
                                htmlAdmin
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
        `SELECT a.*, ani.nombre as animal_nombre, ani.imagen_url
         FROM adopciones a
         JOIN animales ani ON a.animal_id = ani.id
         WHERE a.usuario_id = ?
         ORDER BY a.fecha_solicitud DESC`,
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
        `SELECT a.*, u.nombre as usuario_nombre, u.email as usuario_email,
                ani.nombre as animal_nombre, ani.id as animal_id
         FROM adopciones a
         JOIN usuarios u ON a.usuario_id = u.id
         JOIN animales ani ON a.animal_id = ani.id
         ORDER BY a.fecha_solicitud DESC`,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error" });
            }
            res.json(results);
        }
    );
});

// ===============================
// ✅ APROBAR ADOPCIÓN
// ===============================
router.put("/aprobar/:id", auth, role("admin", "superadmin"), async (req, res) => {
    const id = req.params.id;

    // Obtener datos de la adopción
    db.query(
        `SELECT a.*, u.email as user_email, u.nombre as user_nombre,
                ani.nombre as animal_nombre, ani.id as animal_id
         FROM adopciones a
         JOIN usuarios u ON a.usuario_id = u.id
         JOIN animales ani ON a.animal_id = ani.id
         WHERE a.id = ?`,
        [id],
        async (err, result) => {
            if (err || result.length === 0) {
                return res.status(500).json({ error: "Error al obtener adopción" });
            }

            const adopcion = result[0];

            // Actualizar estado de adopción
            db.query("UPDATE adopciones SET estado = 'aprobado' WHERE id = ?", [id], async (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ error: "Error al aprobar" });
                }

                // Cambiar estado del animal a Adoptado
                db.query("UPDATE animales SET estado = 'Adoptado' WHERE id = ?", [adopcion.animal_id]);

                // Enviar email de aprobación
                try {
                    const htmlAprobacion = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px;">
                            <h2 style="color: #4CAF50;">🎉 ¡Adopción aprobada!</h2>
                            <p>Hola <strong>${adopcion.user_nombre}</strong>,</p>
                            <p>¡Excelentes noticias! Tu solicitud para adoptar a <strong>${adopcion.animal_nombre}</strong> ha sido <strong style="color: green;">APROBADA</strong>.</p>
                            <p>Pronto nos pondremos en contacto para coordinar la entrega.</p>
                            <hr>
                            <p style="font-size: 12px;">Refugio de Animales 🐾</p>
                        </div>
                    `;
                    await enviarCorreo(
                        adopcion.user_email,
                        "🎉 ¡Adopción aprobada!",
                        `Felicidades, tu adopción de ${adopcion.animal_nombre} fue aprobada`,
                        htmlAprobacion
                    );
                } catch (e) {
                    console.error("Error email aprobación:", e);
                }

                res.json({ mensaje: "Adopción aprobada", exito: true });
            });
        }
    );
});

// ===============================
// ❌ RECHAZAR ADOPCIÓN
// ===============================
router.put("/rechazar/:id", auth, role("admin", "superadmin"), async (req, res) => {
    const id = req.params.id;

    // Obtener datos de la adopción
    db.query(
        `SELECT a.*, u.email as user_email, u.nombre as user_nombre,
                ani.nombre as animal_nombre
         FROM adopciones a
         JOIN usuarios u ON a.usuario_id = u.id
         JOIN animales ani ON a.animal_id = ani.id
         WHERE a.id = ?`,
        [id],
        async (err, result) => {
            if (err || result.length === 0) {
                return res.status(500).json({ error: "Error al obtener adopción" });
            }

            const adopcion = result[0];

            // Actualizar estado de adopción
            db.query("UPDATE adopciones SET estado = 'rechazado' WHERE id = ?", [id], async (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ error: "Error al rechazar" });
                }

                // Enviar email de rechazo
                try {
                    const htmlRechazo = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px;">
                            <h2 style="color: #f44336;">📝 Actualización de tu solicitud</h2>
                            <p>Hola <strong>${adopcion.user_nombre}</strong>,</p>
                            <p>Lamentamos informarte que tu solicitud para adoptar a <strong>${adopcion.animal_nombre}</strong> ha sido <strong style="color: red;">RECHAZADA</strong>.</p>
                            <p>Te invitamos a conocer otros animales disponibles en nuestro sitio.</p>
                            <hr>
                            <p style="font-size: 12px;">Refugio de Animales 🐾</p>
                        </div>
                    `;
                    await enviarCorreo(
                        adopcion.user_email,
                        "📝 Actualización de tu solicitud de adopción",
                        `Tu solicitud para ${adopcion.animal_nombre} fue rechazada`,
                        htmlRechazo
                    );
                } catch (e) {
                    console.error("Error email rechazo:", e);
                }

                res.json({ mensaje: "Adopción rechazada", exito: true });
            });
        }
    );
});

module.exports = router;