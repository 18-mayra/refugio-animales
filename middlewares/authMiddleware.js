// AUTH MIDDLEWARE - Verifica JWT correctamente CON CONTROL DE INACTIVIDAD
// CON EXCLUSIÓN DE RUTAS PÚBLICAS

const jwt = require("jsonwebtoken");
const pool = require("../db");

const SECRET = process.env.JWT_SECRET || "mi_clave_super_secreta";
const TIEMPO_INACTIVIDAD_MINUTOS = 2; // 2 minutos

// Rutas que NO requieren autenticación
const RUTAS_PUBLICAS = [
    "/api/usuarios/registro",
    "/api/usuarios/login/enviar-codigo",
    "/api/usuarios/login/verificar-codigo",
    "/api/usuarios/logout",
    "/api/usuarios/refresh",
    "/api/mfa/send",
    "/api/mfa/verify",
    "/api/password/recuperar",
    "/api/password/reset",
    "/api/contacto",
    "/api/csrf-token",
    "/test-email",
    "/busqueda",
    "/filtro"
];

module.exports = async (req, res, next) => {
    // 🔥 Si la ruta es pública, saltamos la verificación
    if (RUTAS_PUBLICAS.includes(req.path)) {
        console.log(`✅ [PUBLICO] ${req.method} ${req.path} - Sin autenticación`);
        return next();
    }

    console.log(`\n🔐 [${new Date().toLocaleTimeString()}] Verificando token para: ${req.method} ${req.path}`);

    try {
        // 🔥 1. Obtener header Authorization
        const authHeader = req.headers["authorization"];

        if (!authHeader) {
            console.log("❌ No hay header Authorization");
            return res.status(401).json({ 
                error: "No autorizado - sin token" 
            });
        }

        // 🔥 2. Validar formato Bearer
        if (!authHeader.startsWith("Bearer ")) {
            console.log("❌ Formato incorrecto");
            return res.status(401).json({ 
                error: "Formato de token inválido" 
            });
        }

        // 🔥 3. Extraer token
        const token = authHeader.split(" ")[1];

        if (!token || token === "null" || token === "undefined") {
            console.log("❌ Token vacío");
            return res.status(401).json({ 
                error: "Token vacío o inválido" 
            });
        }

        // 🔥 4. Verificar token
        const decoded = jwt.verify(token, SECRET);
        console.log(`✅ Token válido - Usuario ID: ${decoded.id}`);

        // 🔥 5. Validar contenido del token
        if (!decoded.id) {
            return res.status(403).json({ 
                error: "Token inválido - sin ID" 
            });
        }

        // ============================================================
        // 🔥 6. VERIFICAR SESIÓN ACTIVA EN BASE DE DATOS
        // ============================================================
        
        const [sesiones] = await pool.promise().query(
            `SELECT id, user_id, token, created_at 
             FROM sesiones 
             WHERE user_id = ? AND token = ?`,
            [decoded.id, token]
        );

        console.log(`📊 Sesiones encontradas: ${sesiones.length}`);

        if (sesiones.length === 0) {
            console.log(`❌ Sesión no encontrada para usuario ${decoded.id}`);
            return res.status(401).json({ 
                error: "Sesión no válida - inicia sesión nuevamente",
                code: "SESSION_NOT_FOUND"
            });
        }

        // ============================================================
        // 🔥 7. VERIFICAR TIEMPO DE INACTIVIDAD
        // ============================================================
        
        const ultimaActividad = new Date(sesiones[0].created_at);
        const ahora = new Date();
        const minutosInactividad = (ahora - ultimaActividad) / 1000 / 60;
        const segundosInactividad = (ahora - ultimaActividad) / 1000;

        console.log(`⏰ Última actividad: ${ultimaActividad.toLocaleTimeString()}`);
        console.log(`⏰ Ahora: ${ahora.toLocaleTimeString()}`);
        console.log(`⏰ Inactividad: ${minutosInactividad.toFixed(2)} minutos (${segundosInactividad.toFixed(0)} segundos)`);

        if (minutosInactividad > TIEMPO_INACTIVIDAD_MINUTOS) {
            console.log(`🚨 SESIÓN EXPIRADA por inactividad de ${minutosInactividad.toFixed(2)} minutos`);
            
            // Eliminar sesión expirada
            await pool.promise().query(
                'DELETE FROM sesiones WHERE id = ?',
                [sesiones[0].id]
            );
            
            return res.status(401).json({ 
                error: `Sesión expirada por inactividad (${TIEMPO_INACTIVIDAD_MINUTOS} minutos)`,
                code: "SESSION_EXPIRED"
            });
        }

        // ============================================================
        // 🔥 8. ACTUALIZAR ÚLTIMA ACTIVIDAD (renovar el tiempo)
        // ============================================================
        
        await pool.promise().query(
            'UPDATE sesiones SET created_at = NOW() WHERE id = ?',
            [sesiones[0].id]
        );
        console.log(`✅ Actividad actualizada - Nueva hora: ${new Date().toLocaleTimeString()}`);

        // ============================================================
        // 🔥 9. Guardar usuario en request
        // ============================================================
        
        req.usuario = {
            id: decoded.id,
            rol: decoded.rol,
            nombre: decoded.nombre || 'Usuario',
            email: decoded.email
        };

        console.log(`✅ Usuario autenticado: ${req.usuario.email}`);

        next();

    } catch (error) {

        console.error("❌ Error en authMiddleware:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                error: "Token expirado - inicia sesión nuevamente",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({ 
                error: "Token inválido",
                code: "INVALID_TOKEN"
            });
        }

        return res.status(500).json({ 
            error: "Error interno de autenticación"
        });
    }
};