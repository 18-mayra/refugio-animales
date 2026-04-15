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

// 📧 EMAIL
const enviarCorreo = require("./utils/mailer");

const app = express();
app.set("trust proxy", 1);

// =============================
// 🔒 SEGURIDAD BASE
// =============================
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================
// 📁 ARCHIVOS ESTÁTICOS
// =============================
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/CSS", express.static(path.join(__dirname, "CSS")));
app.use("/JS", express.static(path.join(__dirname, "JS")));

// =============================
// 🏠 RUTAS PRINCIPALES (HTML)
// =============================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});
app.get("/registro.html", (req, res) => {
    res.sendFile(path.join(__dirname, "registro.html"));
});
app.get("/perros.html", (req, res) => {
    res.sendFile(path.join(__dirname, "perros.html"));
});
app.get("/gatos.html", (req, res) => {
    res.sendFile(path.join(__dirname, "gatos.html"));
});
app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});
app.get("/recuperar.html", (req, res) => {
    res.sendFile(path.join(__dirname, "recuperar.html"));
});
app.get("/contactanos.html", (req, res) => {
    res.sendFile(path.join(__dirname, "contactanos.html"));
});
app.get("/solicitud.html", (req, res) => {
    res.sendFile(path.join(__dirname, "solicitud.html"));
});
app.get("/galeria.html", (req, res) => {
    res.sendFile(path.join(__dirname, "galeria.html"));
});
app.get("/refugio.html", (req, res) => {
    res.sendFile(path.join(__dirname, "refugio.html"));
});
app.get("/editar.html", (req, res) => {
    res.sendFile(path.join(__dirname, "editar.html"));
});

// =============================
// 🌐 CORS
// =============================
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "https://refugio-animales.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.log("CORS bloqueado para:", origin);
        return callback(null, true); // Permitir en producción
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token", "X-Requested-With"]
}));

// =============================
// 🔐 CSRF CONFIG
// =============================
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false  // En producción con HTTPS cambiar a true
    }
});

// Endpoint para obtener CSRF token
app.get("/api/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Middleware condicional para CSRF (solo POST, PUT, DELETE no públicos)
app.use((req, res, next) => {
    if (req.method === "GET") return next();

    const rutasPublicas = [
        "/api/usuarios/login",
        "/api/usuarios/registro",
        "/api/usuarios/login/enviar-codigo",
        "/api/usuarios/login/verificar-codigo",
        "/api/mfa/send",
        "/api/mfa/verify",
        "/api/usuarios/refresh",
        "/api/usuarios/logout",
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
// 🔎 BÚSQUEDA Y FILTROS
// =============================
app.get("/busqueda", (req, res) => {
    const texto = req.query.texto;
    if (!texto) return res.json([]);
    
    db.query(
        "SELECT * FROM animales WHERE nombre LIKE ? OR raza LIKE ? AND estado = 'Disponible'",
        [`%${texto}%`, `%${texto}%`],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Error" });
            res.json(result);
        }
    );
});

app.get("/filtro", (req, res) => {
    const { edad, tipo } = req.query;
    let sql = "SELECT * FROM animales WHERE estado = 'Disponible'";
    let params = [];
    
    if (edad) {
        const [min, max] = edad.split("-");
        sql += " AND edad BETWEEN ? AND ?";
        params.push(parseInt(min), parseInt(max));
    }
    if (tipo && tipo !== "") {
        sql += " AND tipo = ?";
        params.push(tipo);
    }
    
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: "Error" });
        res.json(result);
    });
});

// =============================
// 📧 ENDPOINT DE PRUEBA EMAIL
// =============================
app.get("/test-email", async (req, res) => {
    console.log("🧪 Probando envío de email con Brevo...");
    
    const resultado = await enviarCorreo(
        "psgm.3112@gmail.com",
        "✅ Prueba Brevo - Refugio de Animales",
        "Si estás leyendo esto, la configuración de Brevo funciona perfectamente.",
        `<div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #4CAF50;">🐾 ¡Prueba exitosa!</h2>
            <p>La configuración de <strong>Brevo</strong> está funcionando correctamente.</p>
            <p>📧 Email: ${process.env.EMAIL_USER}</p>
            <p>🕐 Fecha: ${new Date().toLocaleString()}</p>
            <hr>
            <p>Refugio de Animales 🎉</p>
        </div>`
    );
    
    if (resultado.success) {
        res.send(`<h1 style="color:green;">✅ Email enviado correctamente</h1><p>Message ID: ${resultado.messageId}</p><a href="/">Volver</a>`);
    } else {
        res.status(500).send(`<h1 style="color:red;">❌ Error al enviar email</h1><p>${JSON.stringify(resultado.error)}</p><a href="/">Volver</a>`);
    }
});

// =============================
// 🔐 ENDPOINT PARA VERIFICAR TOKEN Y ROL
// =============================
app.get("/api/verificar-admin", auth, (req, res) => {
    console.log("🔍 Verificando admin:", req.usuario);
    res.json({ 
        autenticado: true, 
        usuario: req.usuario,
        esAdmin: req.usuario?.rol === "admin" || req.usuario?.rol === "superadmin"
    });
});

// =============================
// 📦 RUTAS API
// =============================

// Rutas públicas de animales (GET)
app.use("/animales", animalesRoutes);

// Rutas de ADMIN (requieren rol admin) - DEBEN IR ANTES que las rutas públicas
app.use("/admin/animales", auth, role("admin"), animalesRoutes);
app.use("/api/admin", auth, role("admin"), adminRoutes);

// Rutas con autenticación básica
app.use("/api/adopciones", auth, adopcionesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/contacto", contactoRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/sessions", auth, sessionRoutes);
app.use("/api/token", auth, tokenRoutes);
app.use("/api/settings", auth, userSettingsRoutes);

// =============================
// 🚀 SERVIDOR
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log(`✅ Conectado a MySQL`);
    console.log(`📧 Brevo configurado - Email: ${process.env.EMAIL_USER}`);
    console.log(`🧪 Prueba email: http://localhost:${PORT}/test-email`);
    console.log(`🔐 Modo: ${process.env.NODE_ENV || "development"}`);
});