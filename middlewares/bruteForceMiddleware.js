const db = require("../db");

/**
 * MIDDLEWARE DE BLOQUEO POR IP
 * Usa la tabla: intentos
 */

const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_MINUTOS = 15;

// Obtener IP real
const getRealIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
};

// Verificar si IP está bloqueada
const isIPBlocked = async (ip) => {
  return new Promise((resolve) => {
    db.query(
      `SELECT bloqueado_hasta FROM intentos 
       WHERE ip = ? AND bloqueado_hasta > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [ip],
      (err, results) => {
        if (err) {
          console.error("Error checking IP block:", err);
          resolve({ bloqueado: false });
          return;
        }
        
        if (results.length > 0 && results[0].bloqueado_hasta) {
          const bloqueadoHasta = new Date(results[0].bloqueado_hasta);
          const ahora = new Date();
          
          if (bloqueadoHasta > ahora) {
            const minutosRestantes = Math.ceil((bloqueadoHasta - ahora) / 60000);
            resolve({ bloqueado: true, minutosRestantes });
          } else {
            resolve({ bloqueado: false });
          }
        } else {
          resolve({ bloqueado: false });
        }
      }
    );
  });
};

// Registrar intento fallido
const registrarIntentoFallido = async (ip, email = null) => {
  return new Promise((resolve) => {
    db.query(
      `SELECT id, intentos, bloqueado_hasta FROM intentos 
       WHERE ip = ? AND (bloqueado_hasta IS NULL OR bloqueado_hasta < NOW())
       ORDER BY id DESC LIMIT 1`,
      [ip],
      (err, results) => {
        if (err) {
          console.error("Error checking attempts:", err);
          resolve(false);
          return;
        }

        if (results.length > 0) {
          const nuevosIntentos = results[0].intentos + 1;
          
          if (nuevosIntentos >= MAX_INTENTOS) {
            const bloqueadoHasta = new Date(Date.now() + TIEMPO_BLOQUEO_MINUTOS * 60000);
            db.query(
              `UPDATE intentos 
               SET intentos = ?, bloqueado_hasta = ?, ultimo_intento = NOW(), email = ?
               WHERE id = ?`,
              [nuevosIntentos, bloqueadoHasta, email, results[0].id],
              (err2) => { if (err2) console.error("Error updating block:", err2); }
            );
          } else {
            db.query(
              `UPDATE intentos 
               SET intentos = ?, ultimo_intento = NOW(), email = ?
               WHERE id = ?`,
              [nuevosIntentos, email, results[0].id],
              (err2) => { if (err2) console.error("Error updating attempts:", err2); }
            );
          }
        } else {
          db.query(
            `INSERT INTO intentos (ip, email, intentos, ultimo_intento) 
             VALUES (?, ?, 1, NOW())`,
            [ip, email],
            (err2) => { if (err2) console.error("Error creating attempt:", err2); }
          );
        }
        resolve(true);
      }
    );
  });
};

// Limpiar intentos después de login exitoso
const limpiarIntentos = async (ip) => {
  return new Promise((resolve) => {
    db.query(`DELETE FROM intentos WHERE ip = ?`, [ip], (err) => {
      if (err) console.error("Error clearing attempts:", err);
      resolve(true);
    });
  });
};

// Obtener estadísticas de bloqueo
const getBlockStats = async (ip) => {
  return new Promise((resolve) => {
    db.query(
      `SELECT intentos, bloqueado_hasta, ultimo_intento 
       FROM intentos 
       WHERE ip = ? 
       ORDER BY id DESC LIMIT 1`,
      [ip],
      (err, results) => {
        if (err || results.length === 0) {
          resolve({ intentos: 0, bloqueado: false, maxIntentos: MAX_INTENTOS });
          return;
        }
        
        const bloqueado = results[0].bloqueado_hasta && new Date(results[0].bloqueado_hasta) > new Date();
        resolve({
          intentos: results[0].intentos,
          bloqueado: bloqueado,
          maxIntentos: MAX_INTENTOS,
          bloqueadoHasta: results[0].bloqueado_hasta,
          ultimoIntento: results[0].ultimo_intento
        });
      }
    );
  });
};

// 🔥 MIDDLEWARE PRINCIPAL para rutas protegidas
const bruteForceProtection = async (req, res, next) => {
  const ip = getRealIP(req);
  const blockStatus = await isIPBlocked(ip);
  
  if (blockStatus.bloqueado) {
    return res.status(429).json({
      error: `Demasiados intentos fallidos. IP bloqueada por ${blockStatus.minutosRestantes} minutos.`
    });
  }
  
  req.bruteForce = { ip };
  next();
};

// 🔥 MIDDLEWARE ESPECÍFICO PARA LOGIN
const loginBruteForce = async (req, res, next) => {
  const ip = getRealIP(req);
  const email = req.body.email;
  
  // Verificar bloqueo
  const blockStatus = await isIPBlocked(ip);
  
  if (blockStatus.bloqueado) {
    return res.status(429).json({
      error: `IP bloqueada. Intenta nuevamente en ${blockStatus.minutosRestantes} minutos.`
    });
  }
  
  // Guardar referencia para usar después
  req.bruteForce = { ip, email };
  
  // Interceptar response para detectar login fallido
  const originalJson = res.json;
  res.json = function(data) {
    const isError = res.statusCode >= 400 || data?.error || 
                    data?.mensaje?.includes("incorrecta") || 
                    data?.mensaje?.includes("no encontrado");
    
    if (isError) {
      registrarIntentoFallido(ip, email);
    } else {
      limpiarIntentos(ip);
    }
    
    originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  bruteForceProtection,
  loginBruteForce,
  getBlockStats,
  limpiarIntentos,
  registrarIntentoFallido,
  isIPBlocked,
  MAX_INTENTOS,
  TIEMPO_BLOQUEO_MINUTOS
};