// JS/auth.js - Sistema global de sesión

document.addEventListener("DOMContentLoaded", () => {
    renderAuth();
});

function renderAuth() {
    const token = localStorage.getItem("accessToken");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const authLink = document.getElementById("authLink");

    if (!authLink) return;

    if (token && usuario.nombre) {
        const inicial = usuario.nombre.charAt(0).toUpperCase();
        const rolTexto = usuario.rol === "admin" ? "Administrador" : "Usuario";
        const rolClass = usuario.rol === "admin" ? "admin" : "user";
        
        authLink.innerHTML = `
            <div class="user-menu">
                <div class="user-avatar">${inicial}</div>
                <div class="user-info">
                    <span class="user-name">
                        ${usuario.nombre}
                        <span class="role-badge ${rolClass}">${rolTexto}</span>
                    </span>
                    <span class="user-role">🐾 Bienvenido</span>
                </div>
                <button onclick="cerrarSesion()" class="btn-logout">
                    <span class="logout-icon">🚪</span>
                    <span class="logout-text">Salir</span>
                </button>
            </div>
        `;
    } else {
        authLink.innerHTML = `
            <a href="login.html" class="btn-login-nav">
                <span>🔐 Iniciar sesión</span>
            </a>
        `;
    }
}

function cerrarSesion() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("usuario");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login.html";
}