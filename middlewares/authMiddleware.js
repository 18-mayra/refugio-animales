// 🔐 AUTH MIDDLEWARE - Verifica JWT

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "mi_clave_super_secreta";

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
        const decoded = jwt.verify(token, SECRET);
        console.log("🔍 Token decodificado:", { id: decoded.id, rol: decoded.rol, email: decoded.email });
        req.usuario = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expirado", code: "TOKEN_EXPIRED" });
        }
        console.error("❌ Error verificando token:", error.message);
        return res.status(403).json({ error: "Token inválido" });
    }
};