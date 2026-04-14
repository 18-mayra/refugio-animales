console.log("🔥 SERVER ARRANCANDO");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

// 🔐 MIDDLEWARES
const auth = require("./middlewares/authMiddleware");
const role = require("./middlewares/roleMiddleware");
const auditoria = require("./middlewares/auditoria");

// 📦 RUTAS
const usuariosRoutes = require("./routes/usuarios");
const animalesRoutes = require("./routes/animales");
const adopcionesRoutes = require("./routes/adopciones");
const adminRoutes = require("./routes/adminRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const mfaRoutes = require("./routes/mfaRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const userSettingsRoutes = require("./routes/userSettings");
const contactoRoutes = require("./routes/contactoRoutes");

const app = express();
app.set("trust proxy", 1);

// =============================
// 🔒 SEGURIDAD BASE
// =============================
app.use(cookieParser());
app.use(express.json());

// =============================
// 📄 SERVIR ARCHIVOS ESTÁTICOS (HTML, CSS, JS)
// =============================
app.use(express.static(__dirname));

// Servir imágenes
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/CSS", express.static(path.join(__dirname, "CSS")));
app.use("/JS", express.static(path.join(__dirname, "JS")));

// =============================
// 🌐 CORS
// =============================
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://refugio-animales.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS bloqueado"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token"]
}));

// =============================
// 🔐 CSRF CONFIG
// =============================
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false
    }
});

// Ruta para obtener token CSRF
app.get("/api/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// CSRF solo para POST/PUT/DELETE
app.use((req, res, next) => {
    if (req.method === "GET") return next();

    const rutasLibres = [
        "/api/usuarios/login",
        "/api/usuarios/registro",
        "/api/mfa/send",
        "/api/mfa/verify",
        "/api/usuarios/refresh",
        "/api/usuarios/logout",
        "/api/adopciones",
        "/api/adopciones/aprobar",
        "/api/adopciones/rechazar",
        "/api/password/recuperar",
        "/api/password/reset",
        "/api/admin/upload",
        "/api/contacto"
    ];

    if (rutasLibres.includes(req.path)) return next();

    csrfProtection(req, res, next);
});

// =============================
// 📦 RUTAS API
// =============================
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/adopciones", adopcionesRoutes);
app.use("/api/admin", auth, role("admin"), adminRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/settings", userSettingsRoutes);
app.use("/api/contacto", contactoRoutes);
app.use("/animales", animalesRoutes);
app.use("/admin/animales", auth, auditoria, animalesRoutes);

// =============================
// 🔎 BÚSQUEDA
// =============================
app.get("/busqueda", (req, res) => {
    const texto = req.query.texto;
    db.query("SELECT * FROM animales WHERE nombre LIKE ? OR raza LIKE ?", [`%${texto}%`, `%${texto}%`], (err, result) => {
        if (err) return res.status(500).json({ error: "Error" });
        res.json(result);
    });
});

app.get("/filtro", (req, res) => {
    const { edad } = req.query;
    let sql = "SELECT * FROM animales WHERE 1=1";
    let params = [];
    if (edad) {
        const [min, max] = edad.split("-");
        sql += " AND edad BETWEEN ? AND ?";
        params.push(parseInt(min), parseInt(max));
    }
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: "Error" });
        res.json(result);
    });
});

// =============================
// 🚀 SERVIDOR
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log("✅ Conectado a MySQL");
});