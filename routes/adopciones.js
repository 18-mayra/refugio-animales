const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const auditoria = require("../middlewares/auditoria");

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
    
    // Validación
    if (!animal_id || !nombre || !email || !telefono) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    
    // Verificar que el animal existe y está disponible
    db.query("SELECT estado FROM animales WHERE id = ?", [animal_id], (err, animal) => {
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
        
        db.query(sql, values, (err2, result) => {
            if (err2) {
                console.error("Error al crear solicitud:", err2);
                return res.status(500).json({ error: "Error al crear solicitud" });
            }
            
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
    
    // Obtener el animal_id de la adopción
    db.query("SELECT animal_id FROM adopciones WHERE id = ?", [adopcionId], (err, result) => {
        if (err || result.length === 0) {
            return res.status(500).json({ error: "Error al obtener adopción" });
        }
        
        const animalId = result[0].animal_id;
        
        // Actualizar estado de la adopción
        db.query("UPDATE adopciones SET estado = 'aprobado' WHERE id = ?", [adopcionId], (err2) => {
            if (err2) {
                console.error("Error al aprobar:", err2);
                return res.status(500).json({ error: "Error al aprobar" });
            }
            
            // Cambiar animal a ADOPTADO
            db.query("UPDATE animales SET estado = 'Adoptado' WHERE id = ?", [animalId], (err3) => {
                if (err3) {
                    console.error("Error al actualizar animal:", err3);
                }
                
                res.json({ mensaje: "Adopción aprobada. Animal marcado como adoptado." });
            });
        });
    });
});

// ===============================
// ❌ RECHAZAR ADOPCIÓN (ADMIN)
// ===============================
router.put("/rechazar/:id", auth, role("admin", "superadmin"), auditoria, (req, res) => {
    db.query("UPDATE adopciones SET estado = 'rechazado' WHERE id = ?", [req.params.id], (err) => {
        if (err) {
            console.error("Error al rechazar:", err);
            return res.status(500).json({ error: "Error al rechazar" });
        }
        res.json({ mensaje: "Adopción rechazada" });
    });
});

module.exports = router;