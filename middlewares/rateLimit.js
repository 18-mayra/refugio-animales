const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos, intenta en 1 minuto"
  }
});

// 🔐 MFA (máx 3 intentos)
const mfaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: {
    error: "Demasiados intentos de código"
  }
});

module.exports = {
  loginLimiter,
  mfaLimiter
};