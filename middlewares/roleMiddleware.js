module.exports = (...rolesPermitidos) => {
    return (req, res, next) => {

        const usuario = req.usuario;

        console.log("🔍 roleMiddleware - Usuario:", usuario);
        console.log("🔍 roleMiddleware - Roles permitidos:", rolesPermitidos);

        if (!usuario) {
            console.log("❌ No hay usuario en req");
            return res.status(401).json({ error: "No autenticado" });
        }

        const rolUsuario = usuario.rol;

        console.log("👤 Rol usuario:", rolUsuario);

        if (rolesPermitidos.length === 0) {
            console.log("✅ Sin restricciones de rol");
            return next();
        }

        if (rolesPermitidos.includes(rolUsuario)) {
            console.log("✅ Rol autorizado:", rolUsuario);
            return next();
        }

        console.log("❌ Rol NO autorizado. Se requiere:", rolesPermitidos);
        return res.status(403).json({
            error: `No tienes permisos. Se requiere: ${rolesPermitidos.join(", ")}`
        });
    };
};