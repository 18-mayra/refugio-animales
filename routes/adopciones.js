const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const auditoria = require("../middlewares/auditoria");
const enviarCorreo = require("../utils/mailer");

// ===============================
// 📝 CREAR SOLICITUD DE ADOPCIÓN
// ===============================
router.post("/", auth, auditoria, (req, res) => {
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
        return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    
    db.query("SELECT estado, nombre as animal_nombre FROM animales WHERE id = ?", [animal_id], (err, animal) => {
        if (err) {
            console.error("Error DB:", err);
            return res.status(500).json({ error: "Error al verificar animal" });
        }
        
        if (animal.length === 0) {
            return res.status(404).json({ error: "Animal no encontrado" });
        }
        
        if (animal[0].estado !== "Disponible") {
            return res.status(400).json({ error: "Este animal ya no está disponible" });
        }
        
        const sql = `INSERT INTO adopciones 
            (usuario_id, animal_id, nombre, email, telefono, direccion, mensaje, tiene_mascotas, tipo_vivienda, estado, fecha_solicitud) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())`;
        
        const values = [
            usuario_id, 
            animal_id, 
            nombre, 
            email, 
            telefono, 
            direccion || null, 
            mensaje || null, 
            tieneMascotas || 'no', 
            tipoVivienda || 'casa'
        ];
        
        db.query(sql, values, async (err2, result) => {
            if (err2) {
                console.error("Error al crear solicitud:", err2);
                return res.status(500).json({ error: "Error al crear solicitud" });
            }
            
            // Enviar confirmación al usuario
            const htmlConfirmacion = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #4CAF50;">📋 Solicitud de adopción recibida</h2>
                    <p>Hola <strong>${nombre}</strong>,</p>
                    <p>Hemos recibido tu solicitud para adoptar a <strong>${animal[0].animal_nombre}</strong>.</p>
                    <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <p><strong>Estado:</strong> <span style="color: orange;">Pendiente de revisión</span></p>
                        <p><strong>ID de solicitud:</strong> ${result.insertId}</p>
                    </div>
                    <p>Te contactaremos pronto para informarte sobre el proceso.</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">Refugio de Animales 🐾</p>
                </div>
            `;
            
            await enviarCorreo(email, "📋 Solicitud de adopción recibida", `Hemos recibido tu solicitud para adoptar a ${animal[0].animal_nombre}`, htmlConfirmacion);
            
            // Notificar al administrador
            await enviarCorreo(
                process.env.EMAIL_USER || "psgm.3112@gmail.com",
                "🆕 Nueva solicitud de adopción",
                `📋 NUEVA SOLICITUD DE ADOPCIÓN\n\nAnimal: ${animal[0].animal_nombre}\nSolicitante: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}\n\nRevisar en el panel de administración.`
            );
            
            res.json({ 
                mensaje: "Solicitud enviada correctamente", 
                id: result.insertId 
            });
        });
    });
});

// ===============================
// 📋 VER MIS SOLICITUDES (USUARIO)
// ===============================
router.get("/mis-solicitudes", auth, (req, res) => {
    const usuario_id = req.usuario.id;
    
    const sql = `
        SELECT a.*, ani.nombre as animal_nombre, ani.tipo as animal_tipo
        FROM adopciones a
        JOIN animales ani ON a.animal_id = ani.id
        WHERE a.usuario_id = ?
        ORDER BY a.fecha_solicitud DESC
    `;
    
    db.query(sql, [usuario_id], (err, results) => {
        if (err) {
            console.error("Error:", err);
            return res.status(500).json({ error: "Error al obtener solicitudes" });
        }
        res.json(results);
    });
});

// ===============================
// 👑 VER TODAS LAS SOLICITUDES (ADMIN)
// ===============================
router.get("/", auth, role("admin", "superadmin"), (req, res) => {
    const sql = `
        SELECT a.*, 
               u.nombre as usuario_nombre, u.email as usuario_email,
               ani.nombre as animal_nombre, ani.tipo as animal_tipo
        FROM adopciones a
        JOIN usuarios u ON a.usuario_id = u.id
        JOIN animales ani ON a.animal_id = ani.id
        ORDER BY a.fecha_solicitud DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error:", err);
            return res.status(500).json({ error: "Error al obtener solicitudes" });
        }
        res.json(results);
    });
});

// ===============================
// ✅ APROBAR ADOPCIÓN (ADMIN)
// ===============================
router.put("/aprobar/:id", auth, role("admin", "superadmin"), auditoria, (req, res) => {
    const adopcionId = req.params.id;
    
    db.query(`
        SELECT a.*, u.email as user_email, u.nombre as user_nombre, 
               ani.nombre as animal_nombre, ani.id as animal_id
        FROM adopciones a
        JOIN usuarios u ON a.usuario_id = u.id
        JOIN animales ani ON a.animal_id = ani.id
        WHERE a.id = ?
    `, [adopcionId], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(500).json({ error: "Error al obtener adopción" });
        }
        
        const adopcion = result[0];
        const animalId = adopcion.animal_id;
        
        db.query("UPDATE adopciones SET estado = 'aprobado' WHERE id = ?", [adopcionId], async (err2) => {
            if (err2) {
                console.error("Error al aprobar:", err2);
                return res.status(500).json({ error: "Error al aprobar" });
            }
            
            db.query("UPDATE animales SET estado = 'Adoptado' WHERE id = ?", [animalId], async (err3) => {
                if (err3) {
                    console.error("Error al actualizar animal:", err3);
                }
                
                // Enviar email de aprobación al usuario
                const htmlAprobacion = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #4CAF50;">🎉 ¡Felicidades! Tu solicitud fue aprobada</h2>
                        <p>Hola <strong>${adopcion.user_nombre}</strong>,</p>
                        <p>¡Excelentes noticias! Tu solicitud para adoptar a <strong>${adopcion.animal_nombre}</strong> ha sido <strong style="color: green;">APROBADA</strong>.</p>
                        <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>📝 Próximos pasos:</strong></p>
                            <ul>
                                <li>Te llamaremos en los próximos días</li>
                                <li>Prepara los documentos necesarios</li>
                                <li>Prepara un espacio acogedor para tu nuevo amigo</li>
                            </ul>
                        </div>
                        <p>¡Gracias por darle un hogar a ${adopcion.animal_nombre}! 🐾</p>
                        <hr>
                        <p style="font-size: 12px; color: #666;">Refugio de Animales - Amor sin condiciones</p>
                    </div>
                `;
                
                await enviarCorreo(adopcion.user_email, "🎉 ¡Adopción aprobada!", `Felicidades, tu adopción de ${adopcion.animal_nombre} fue aprobada`, htmlAprobacion);
                
                res.json({ mensaje: "Adopción aprobada. Animal marcado como adoptado." });
            });
        });
    });
});

// ===============================
// ❌ RECHAZAR ADOPCIÓN (ADMIN)
// ===============================
router.put("/rechazar/:id", auth, role("admin", "superadmin"), auditoria, (req, res) => {
    const adopcionId = req.params.id;
    
    db.query(`
        SELECT a.*, u.email as user_email, u.nombre as user_nombre, ani.nombre as animal_nombre
        FROM adopciones a
        JOIN usuarios u ON a.usuario_id = u.id
        JOIN animales ani ON a.animal_id = ani.id
        WHERE a.id = ?
    `, [adopcionId], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(500).json({ error: "Error al obtener adopción" });
        }
        
        const adopcion = result[0];
        
        db.query("UPDATE adopciones SET estado = 'rechazado' WHERE id = ?", [adopcionId], async (err2) => {
            if (err2) {
                console.error("Error al rechazar:", err2);
                return res.status(500).json({ error: "Error al rechazar" });
            }
            
            // Enviar email de rechazo al usuario
            const htmlRechazo = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #f44336;">📝 Actualización de tu solicitud</h2>
                    <p>Hola <strong>${adopcion.user_nombre}</strong>,</p>
                    <p>Lamentamos informarte que tu solicitud para adoptar a <strong>${adopcion.animal_nombre}</strong> ha sido <strong style="color: red;">RECHAZADA</strong> en esta ocasión.</p>
                    <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Motivo:</strong> No cumple con los requisitos del proceso de adopción.</p>
                    </div>
                    <p>Te invitamos a conocer otros animales disponibles en nuestro sitio web.</p>
                    <hr>
                    <p>¡No te desanimes! Hay muchos animalitos esperando un hogar. 🐾</p>
                </div>
            `;
            
            await enviarCorreo(adopcion.user_email, "📝 Actualización de tu solicitud de adopción", `Tu solicitud para adoptar a ${adopcion.animal_nombre} fue rechazada`, htmlRechazo);
            
            res.json({ mensaje: "Adopción rechazada" });
        });
    });
});

module.exports = router;