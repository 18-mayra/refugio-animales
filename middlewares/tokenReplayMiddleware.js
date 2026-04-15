// 🔥 TOKEN REPLAY PREVENTION - VERSIÓN CORREGIDA

const db = require("../db");
const crypto = require("crypto");

// ============================================
// RUTAS EXCLUIDAS (NO se verifica replay)
// ============================================
// Rutas que NO deben ser verificadas (excluidas)
const rutasExcluidas = [
    '/api/usuarios/login',
    '/api/usuarios/registro',
    '/api/mfa/send',      // 👈 AGREGAR
    '/api/mfa/verify',    // 👈 AGREGAR
    '/api/usuarios/refresh',
    '/api/usuarios/logout',
    '/api/usuarios/token/validar',
    '/animales',
    '/busqueda',
    '/filtro'
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================
const generarJTI = () => {
    return crypto.randomBytes(16).toString("hex");
};

const extraerJTI = (token) => {
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload.jti || null;
    } catch {
        return null;
    }
};

const esTokenReutilizado = async (token, jti) => {
    return new Promise((resolve) => {
        db.query(
            `SELECT id FROM token_replay WHERE token = ? OR jti = ? LIMIT 1`,
            [token, jti],
            (err, results) => {
                if (err) {
                    console.error("Error checking token replay:", err);
                    resolve(false);
                    return;
                }
                resolve(results.length > 0);
            }
        );
    });
};

const marcarTokenComoUsado = async (token, jti, expiraEn) => {
    return new Promise((resolve) => {
        db.query(
            `INSERT INTO token_replay (token, jti, expira_en, usado_el) VALUES (?, ?, ?, NOW())`,
            [token, jti, expiraEn],
            (err) => {
                if (err) console.error("Error marking token as used:", err);
                resolve(true);
            }
        );
    });
};

const limpiarTokensExpirados = async () => {
    return new Promise((resolve) => {
        db.query("DELETE FROM token_replay WHERE expira_en < NOW()", (err) => {
            if (err) console.error("Error cleaning token replay:", err);
            resolve(true);
        });
    });
};

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================
const tokenReplayProtection = async (req, res, next) => {
    // 🔥 EXCLUIR rutas específicas
    if (rutasExcluidas.includes(req.path)) {
        return next();
    }
    
    // 🔥 EXCLUIR métodos GET (solo proteger POST, PUT, DELETE)
    if (req.method === 'GET') {
        return next();
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    const jti = extraerJTI(token);

    if (!jti) return next();

    const esReutilizado = await esTokenReutilizado(token, jti);
    
    if (esReutilizado) {
        console.warn(`⚠️ Token replay detectado: ${jti} desde ${req.ip} - ${req.method} ${req.path}`);
        return res.status(401).json({
            error: "Token ya utilizado - Posible ataque de replay"
        });
    }

    req.tokenReplay = { token, jti };
    next();
};

const registrarTokenUsado = async (req, res, next) => {
    // No registrar para rutas excluidas ni para GET
    if (rutasExcluidas.includes(req.path) || req.method === 'GET') {
        return next();
    }
    
    const originalJson = res.json;
    res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.tokenReplay) {
            const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
            marcarTokenComoUsado(req.tokenReplay.token, req.tokenReplay.jti, expiraEn);
            console.log(`📝 Token marcado como usado: ${req.tokenReplay.jti}`);
        }
        originalJson.call(this, data);
    };
    next();
};

const agregarJTIAlToken = (payload) => {
    return {
        ...payload,
        jti: generarJTI(),
        iat: Math.floor(Date.now() / 1000)
    };
};

module.exports = {
    tokenReplayProtection,
    registrarTokenUsado,
    agregarJTIAlToken,
    limpiarTokensExpirados,
    generarJTI
};