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

// 📧 EMAIL (Brevo)
const enviarCorreo = require("./utils/mailer");

const app = express();
app.set("trust proxy", 1);

// =============================
// 🔒 SEGURIDAD BASE
// =============================
app.use(cookieParser());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/CSS", express.static(path.join(__dirname, "CSS")));
app.use("/JS", express.static(path.join(__dirname, "JS")));

// =============================
// 🏠 RUTAS PRINCIPALES
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

app.get("/api/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

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
// 📧 ENDPOINT DE PRUEBA PARA BREVO
// =============================
app.get("/test-email", async (req, res) => {
    console.log("🧪 Probando envío de email con Brevo...");
    
    const resultado = await enviarCorreo(
        "psgm.3112@gmail.com", // Cambia esto si quieres probar con otro email
        "✅ Prueba Brevo - Refugio de Animales",
        "Si estás leyendo esto, la configuración de Brevo funciona perfectamente. ¡Felicidades! Tu servidor está listo para enviar correos.",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4CAF50;">🐾 ¡Prueba exitosa!</h2>
            <p>Si estás viendo este correo con formato HTML, la configuración de <strong>Brevo</strong> está funcionando correctamente.</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>✅ Estado:</strong> Conectado</p>
                <p><strong>📧 Email:</strong> ${process.env.EMAIL_USER}</p>
                <p><strong>🕐 Fecha:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Tu servidor ya puede enviar:</p>
            <ul>
                <li>📧 Correos de bienvenida</li>
                <li>🔐 Códigos de recuperación</li>
                <li>📋 Confirmaciones de adopción</li>
                <li>📬 Mensajes de contacto</li>
            </ul>
            <hr>
            <p style="font-size: 12px; color: #666;">Refugio de Animales - Configuración de email exitosa 🎉</p>
        </div>
        `
    );
    
    if (resultado.success) {
        res.send(`
            <html>
                <head><title>Email Enviado ✅</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #4CAF50;">✅ Email enviado correctamente</h1>
                    <p>Revisa la bandeja de entrada de <strong>psgm.3112@gmail.com</strong></p>
                    <p>Message ID: ${resultado.messageId}</p>
                    <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Volver al inicio</a>
                </body>
            </html>
        `);
    } else {
        res.status(500).send(`
            <html>
                <head><title>Error de Email ❌</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #f44336;">❌ Error al enviar email</h1>
                    <p>Hubo un problema al enviar el correo de prueba.</p>
                    <pre style="background: #f4f4f4; padding: 15px; text-align: left;">${JSON.stringify(resultado.error, null, 2)}</pre>
                    <p>Verifica:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Que la API Key de Brevo sea correcta</li>
                        <li>Que el email ${process.env.EMAIL_USER} esté verificado en Brevo</li>
                        <li>Que no hayas excedido el límite de 300 emails/día</li>
                    </ul>
                    <br>
                    <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Volver al inicio</a>
                </body>
            </html>
        `);
    }
});

// =============================
// 🚀 SERVIDOR
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log(`✅ Conectado a MySQL`);
    console.log(`📧 Brevo configurado - Email: ${process.env.EMAIL_USER}`);
    console.log(`🧪 Prueba email: http://localhost:${PORT}/test-email`);
});