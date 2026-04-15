// 🔐 ROLE MIDDLEWARE - Verifica roles

module.exports = (rolesPermitidos = []) => {
    return (req, res, next) => {
        const usuario = req.usuario;
        
        console.log("🔐 [ROLE] Usuario:", usuario);
        console.log("🔐 [ROLE] Roles permitidos:", rolesPermitidos);
        
        if (!usuario) {
            console.log("❌ [ROLE] No autenticado");
            return res.status(401).json({ error: "No autenticado" });
        }
        
        const rolUsuario = usuario.rol || "usuario";
        
        // Si no se especifican roles, cualquiera autenticado pasa
        if (!rolesPermitidos.length) {
            console.log("✅ [ROLE] Sin restricciones");
            return next();
        }
        
        // Normalizar (mayúsculas/minúsculas)
        if (rolesPermitidos.includes(rolUsuario)) {
            console.log(`✅ [ROLE] Acceso permitido: ${rolUsuario}`);
            return next();
        }
        
        console.log(`❌ [ROLE] Acceso denegado: ${rolUsuario}`);
        
        res.status(403).json({ 
            error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(", ")}`
        });
    };
};