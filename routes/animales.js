const express = require("express");
const router = express.Router();
const db = require("../db");

// 🔐 MIDDLEWARES
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

/* ======================
   OBTENER TODOS (PÚBLICO)
====================== */
router.get("/", (req, res) => {
    const { tipo, estado, busqueda, edad, page, limit } = req.query;
    
    let sql = "SELECT * FROM animales WHERE 1=1";
    let params = [];
    let countSql = "SELECT COUNT(*) as total FROM animales WHERE 1=1";
    let countParams = [];
    
    if (tipo && tipo !== 'todos' && tipo !== '') {
        sql += " AND tipo = ?";
        params.push(tipo);
        countSql += " AND tipo = ?";
        countParams.push(tipo);
    }
    
    if (estado && estado !== 'todos' && estado !== '') {
        sql += " AND estado = ?";
        params.push(estado);
        countSql += " AND estado = ?";
        countParams.push(estado);
    }
    
    if (busqueda && busqueda !== '') {
        sql += " AND (nombre LIKE ? OR raza LIKE ?)";
        params.push(`%${busqueda}%`, `%${busqueda}%`);
        countSql += " AND (nombre LIKE ? OR raza LIKE ?)";
        countParams.push(`%${busqueda}%`, `%${busqueda}%`);
    }
    
    if (edad && edad !== '') {
        const [min, max] = edad.split('-');
        if (min && max) {
            sql += " AND edad BETWEEN ? AND ?";
            params.push(parseInt(min), parseInt(max));
            countSql += " AND edad BETWEEN ? AND ?";
            countParams.push(parseInt(min), parseInt(max));
        }
    }
    
    sql += " ORDER BY id DESC";
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const offset = (pageNum - 1) * limitNum;
    
    let finalSql = sql;
    if (limit && limit !== '') {
        finalSql += ` LIMIT ${limitNum} OFFSET ${offset}`;
    }
    
    db.query(finalSql, params, (err, rows) => {
        if (err) {
            console.error("Error en consulta:", err);
            return res.status(500).json({ error: "Error al obtener animales" });
        }
        
        if (limit && limit !== '') {
            db.query(countSql, countParams, (err2, countResult) => {
                if (err2) {
                    return res.status(500).json({ error: "Error al contar" });
                }
                res.json({
                    animales: rows,
                    total: countResult[0].total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(countResult[0].total / limitNum)
                });
            });
        } else {
            res.json(rows);
        }
    });
});

/* ======================
   OBTENER POR ID (PÚBLICO)
====================== */
router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    
    db.query("SELECT * FROM animales WHERE id = ?", [id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener animal" });
        }
        if (rows.length === 0) {
            return res.status(404).json({ error: "Animal no encontrado" });
        }
        res.json(rows[0]);
    });
});

/* ======================
   AGREGAR (SOLO ADMIN)
====================== */
router.post("/", auth, role("admin"), (req, res) => {
    const { tipo, nombre, edad, raza, comportamiento, vacunas, enfermedades, descripcion, estado, imagen_url } = req.body;
    
    console.log("📝 Creando animal por admin:", req.usuario?.nombre);
    
    if (!tipo || !nombre) {
        return res.status(400).json({ error: "Tipo y nombre son requeridos" });
    }
    
    const imagenFinal = imagen_url || "https://via.placeholder.com/300x200?text=Sin+Imagen";
    
    const sql = `INSERT INTO animales 
        (tipo, nombre, edad, raza, comportamiento, vacunas, enfermedades, descripcion, estado, imagen_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
        tipo, 
        nombre, 
        edad || null, 
        raza || null, 
        comportamiento || null, 
        vacunas || null, 
        enfermedades || null, 
        descripcion || null, 
        estado || "Disponible",
        imagenFinal
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("❌ Error SQL:", err);
            return res.status(500).json({ error: "Error al registrar animal: " + err.message });
        }
        res.json({ ok: true, id: result.insertId, mensaje: "Animal registrado correctamente" });
    });
});

/* ======================
   EDITAR (SOLO ADMIN)
====================== */
router.put("/:id", auth, role("admin"), (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    
    console.log("✏️ Editando animal por admin:", req.usuario?.nombre);
    
    db.query("SELECT id FROM animales WHERE id = ?", [id], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ error: "Animal no encontrado" });
        }
        
        db.query("UPDATE animales SET ? WHERE id = ?", [req.body, id], (err2) => {
            if (err2) {
                console.error("Error al actualizar:", err2);
                return res.status(500).json({ error: "Error al actualizar animal" });
            }
            res.json({ ok: true, mensaje: "Animal actualizado correctamente" });
        });
    });
});

/* ======================
   ELIMINAR (SOLO ADMIN)
====================== */
router.delete("/:id", auth, role("admin"), (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    
    console.log("🗑️ Eliminando animal ID:", id);
    console.log("👤 Usuario que elimina:", req.usuario?.nombre);
    console.log("👑 Rol del usuario:", req.usuario?.rol);
    
    db.query("SELECT id FROM animales WHERE id = ?", [id], (err, rows) => {
        if (err) {
            console.error("Error en SELECT:", err);
            return res.status(500).json({ error: "Error al verificar animal" });
        }
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Animal no encontrado" });
        }
        
        db.query("DELETE FROM animales WHERE id = ?", [id], (err2) => {
            if (err2) {
                console.error("Error al eliminar:", err2);
                return res.status(500).json({ error: "Error al eliminar animal" });
            }
            console.log("✅ Animal eliminado correctamente");
            res.json({ ok: true, mensaje: "Animal eliminado correctamente" });
        });
    });
});

/* ======================
   GALERÍA (PÚBLICO)
====================== */
router.get("/galeria", (req, res) => {
    const { tipo, estado } = req.query;
    
    let sql = "SELECT id, nombre, tipo, edad, raza, estado, descripcion, imagen_url FROM animales WHERE 1=1";
    let params = [];
    
    if (tipo && tipo !== 'todos') {
        sql += " AND tipo = ?";
        params.push(tipo === 'perros' ? 'Perro' : 'Gato');
    }
    
    if (estado && estado !== 'todos') {
        sql += " AND estado = ?";
        params.push(estado);
    }
    
    sql += " ORDER BY id DESC";
    
    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error("Error en galería:", err);
            return res.status(500).json({ error: "Error al obtener galería" });
        }
        res.json(rows);
    });
});

/* ======================
   ESTADÍSTICAS (PÚBLICO)
====================== */
router.get("/stats/resumen", (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN tipo = 'Perro' THEN 1 ELSE 0 END) as perros,
            SUM(CASE WHEN tipo = 'Gato' THEN 1 ELSE 0 END) as gatos,
            SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
            SUM(CASE WHEN estado = 'Adoptado' THEN 1 ELSE 0 END) as adoptados
        FROM animales
    `;
    
    db.query(sql, (err, rows) => {
        if (err) {
            console.error("Error en estadísticas:", err);
            return res.status(500).json({ error: "Error al obtener estadísticas" });
        }
        res.json(rows[0]);
    });
});

module.exports = router;