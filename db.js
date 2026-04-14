const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "refugio_animales",
    port: process.env.DB_PORT || 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificar conexión (opcional)
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Error MySQL:", err);
    } else {
        console.log("✅ Conectado a MySQL");
        connection.release();
    }
});

module.exports = pool;