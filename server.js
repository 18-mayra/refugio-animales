console.log("🔥 SERVER ARRANCANDO");

require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =============================
// 📄 SERVIR ARCHIVOS ESTÁTICOS
// =============================
app.use(express.static(__dirname));

// =============================
// 🏠 RUTA PRINCIPAL
// =============================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =============================
// 🚀 SERVIDOR
// =============================
app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos desde: ${__dirname}`);
});