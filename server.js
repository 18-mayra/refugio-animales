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

const enviarCorreo = require("./utils/mailer");

const app = express();
app.set("trust proxy", 1);

// =============================
// 🔒 SEGURIDAD BASE
// =============================
app.use(cookieParser());
app.use(express.json());

// =============================
// 📁 ESTÁTICOS
// =============================
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/CSS", express.static(path.join(__dirname, "CSS")));
app.use("/JS", express.static(path.join(__dirname, "JS")));

// =============================
// 🌐 CORS (FIX IMPORTANTE)
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
            return callback(null, true);
        }

        return callback(null, true); // 🔥 PERMITE EN PRODUCCIÓN (evita bloqueos)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token"]
}));

// =============================
// 🔐 CSRF CONFIG CORREGIDO
// =============================
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false // ⚠️ en Render cambiar a true
    }
});

// TOKEN
app.get("/api/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// 🔥 SOLO PROTEGER LO NECESARIO
app.use((req, res, next) => {

    if (req.method === "GET") return next();

    const rutasPublicas = [
        "/api/usuarios/login",
        "/api/usuarios/registro",
        "/api/usuarios/login/enviar-codigo",
        "/api/usuarios/login/verificar-codigo",
        "/api/mfa/send",
        "/api/mfa/verify",
        "/api/password/recuperar",
        "/api/password/reset",
        "/api/contacto"
    ];

    if (rutasPublicas.includes(req.path)) {
        return next();
    }

    return csrfProtection(req, res, next);
});

// =============================
// 📦 RUTAS API
// =============================
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/adopciones", adopcionesRoutes);

// 🔥 ADMIN PROTEGIDO CORRECTAMENTE
app.use("/api/admin", auth, role("admin"), csrfProtection, adminRoutes);

app.use("/api/mfa", mfaRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/settings", userSettingsRoutes);
app.use("/api/contacto", contactoRoutes);

// 🔥 ANIMALES
app.use("/animales", animalesRoutes);

// 🔥 ADMIN ANIMALES (FIX CLAVE)
app.use("/admin/animales", auth, csrfProtection, auditoria, animalesRoutes);

// =============================
// 🚀 SERVER
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});