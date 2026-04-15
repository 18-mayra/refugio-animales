module.exports = (...rolesPermitidos) => {
    return (req, res, next) => {

        const usuario = req.usuario;

        if (!usuario) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const rolUsuario = usuario.rol;

        console.log("👤 Rol usuario:", rolUsuario);
        console.log("🔐 Roles permitidos:", rolesPermitidos);

        if (rolesPermitidos.length === 0) {
            return next();
        }

        if (rolesPermitidos.includes(rolUsuario)) {
            return next();
        }

        return res.status(403).json({
            error: "No tienes permisos"
        });
    };
};