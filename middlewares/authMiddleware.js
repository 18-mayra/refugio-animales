// 🔐 AUTH MIDDLEWARE - Verifica JWT correctamente

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "mi_clave_super_secreta";

module.exports = (req, res, next) => {

    try {
        // 🔥 1. Obtener header Authorization
        const authHeader = req.headers["authorization"];

        if (!authHeader) {
            return res.status(401).json({ 
                error: "No autorizado - sin token" 
            });
        }

        // 🔥 2. Validar formato Bearer
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                error: "Formato de token inválido" 
            });
        }

        // 🔥 3. Extraer token
        const token = authHeader.split(" ")[1];

        if (!token || token === "null" || token === "undefined") {
            return res.status(401).json({ 
                error: "Token vacío o inválido" 
            });
        }

        // 🔥 4. Verificar token
        const decoded = jwt.verify(token, SECRET);

        // 🔥 5. Validar contenido del token
        if (!decoded.id) {
            return res.status(403).json({ 
                error: "Token inválido - sin ID" 
            });
        }

        // 🔥 6. Guardar usuario en request
        req.usuario = {
            id: decoded.id,
            rol: decoded.rol,
            nombre: decoded.nombre,
            email: decoded.email
        };

        console.log("✅ Usuario autenticado:", req.usuario);

        next();

    } catch (error) {

        console.error("❌ Error en authMiddleware:", error.message);

        // 🔥 Manejo específico de errores
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                error: "Token expirado",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({ 
                error: "Token inválido"
            });
        }

        return res.status(500).json({ 
            error: "Error interno de autenticación"
        });
    }
};