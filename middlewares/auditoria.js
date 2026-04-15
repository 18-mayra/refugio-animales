// 📊 MIDDLEWARE DE AUDITORÍA - Versión corregida

const db = require("../db");

function auditoria(req, res, next) {
    // Guardar la función original de res.json
    const originalJson = res.json;
    
    // Interceptar la respuesta
    res.json = function(data) {
        // Determinar si fue éxito o error
        const esError = res.statusCode >= 400 || (data && data.error);
        const resultado = esError ? "ERROR" : "EXITO";
        
        // Obtener información del usuario (si está autenticado)
        const usuarioId = req.usuario?.id || null;
        const usuarioEmail = req.usuario?.email || req.usuario?.nombre || null;
        
        // Obtener IP real
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.connection?.remoteAddress || 
                   req.ip || 
                   'unknown';
        
        // Obtener User-Agent
        const userAgent = req.headers['user-agent'] || null;
        
        // Construir detalles de la acción
        const detalles = `${req.method} ${req.originalUrl} - Status: ${res.statusCode}`;
        
        // Determinar la acción (para la columna 'accion')
        let accion = `${req.method} ${req.originalUrl}`;
        if (accion.length > 100) {
            accion = accion.substring(0, 100);
        }
        
        // SQL corregido - usando las columnas correctas
        const sql = `
            INSERT INTO auditoria 
            (usuario_id, usuario_email, accion, ip, user_agent, detalles, fecha) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [usuarioId, usuarioEmail, accion, ip, userAgent, detalles];
        
        // Insertar en la base de datos (sin bloquear la respuesta)
        db.query(sql, values, (err) => {
            if (err) {
                console.error("❌ ERROR AUDITORIA:", err);
            } else {
                console.log(`📊 LOG: ${usuarioEmail || 'anon'} ${ip} ${accion} ${resultado}`);
            }
        });
        
        // Llamar a la función original
        originalJson.call(this, data);
    };
    
    next();
}

module.exports = auditoria;