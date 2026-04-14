const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const auditoria = require("../middlewares/auditoria");

// ===============================
// 📁 CONFIGURACIÓN DE SUBIDA DE IMÁGENES
// ===============================
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error("Solo imágenes (jpeg, jpg, png, gif, webp)"));
    }
});

// ===============================
// 🖼️ SUBIR IMAGEN
// ===============================
router.post("/upload", auth, role("admin", "superadmin"), upload.single("imagen"), (req, res) => {
    console.log("📸 Archivo recibido:", req.file);
    if (!req.file) return res.status(400).json({ error: "No se subió ninguna imagen" });
    res.json({ url: `/uploads/${req.file.filename}` });
});

// ===============================
// 🔥 ELIMINAR USUARIO
// ===============================
router.delete("/deleteUser/:id", auth, role("superadmin"), auditoria, (req, res) => {
    const userId = parseInt(req.params.id);
    const { confirmacion } = req.body;
    if (confirmacion !== "CONFIRMO_ELIMINACION") {
        return res.status(400).json({ error: "Debes confirmar con 'CONFIRMO_ELIMINACION'" });
    }
    if (userId === req.usuario.id) {
        return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    }
    db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
    db.query("DELETE FROM sesiones WHERE user_id = ?", [userId]);
    db.query("DELETE FROM usuarios WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar" });
        res.json({ mensaje: "Usuario eliminado correctamente" });
    });
});

// ===============================
// 📦 EXPORTAR BASE DE DATOS
// ===============================
router.get("/exportDatabase", auth, role("superadmin"), auditoria, (req, res) => {
    db.query("SELECT id, nombre, email, rol FROM usuarios", (err, usuarios) => {
        if (err) return res.status(500).json({ error: "Error" });
        db.query("SELECT * FROM animales", (err2, animales) => {
            if (err2) return res.status(500).json({ error: "Error" });
            res.json({ usuarios, animales });
        });
    });
});

// ===============================
// 💰 REPORTES
// ===============================
router.get("/financial/reports", auth, role("admin", "superadmin"), auditoria, (req, res) => {
    db.query("SELECT COUNT(*) as total FROM usuarios", (err, result) => {
        if (err) return res.status(500).json({ error: "Error" });
        res.json({ totalUsuarios: result[0].total });
    });
});

// ===============================
// 👤 VER USUARIO
// ===============================
router.get("/users/:id", auth, auditoria, (req, res) => {
    const userId = parseInt(req.params.id);
    if (req.usuario.id !== userId && req.usuario.rol !== "admin") {
        return res.status(403).json({ error: "No tienes permiso" });
    }
    db.query("SELECT id, nombre, email, rol FROM usuarios WHERE id = ?", [userId], (err, usuario) => {
        if (err || usuario.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json(usuario[0]);
    });
});

module.exports = router;