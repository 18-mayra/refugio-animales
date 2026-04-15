// JS/authGuard.js - Control de sesión y protección de rutas

// ===============================
// CERRAR SESIÓN
// ===============================
function cerrarSesion() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("usuario");
    window.location.href = "/login.html";
}

// ===============================
// VERIFICAR SESIÓN ACTIVA (solo para usuarios logueados)
// ===============================
function verificarSesion() {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
        window.location.href = "/login.html";
        return false;
    }
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiracion = payload.exp * 1000;
        
        if (Date.now() >= expiracion) {
            cerrarSesion();
            return false;
        }
    } catch (e) {
        console.error("Error al verificar token:", e);
        cerrarSesion();
        return false;
    }
    
    return true;
}

// ===============================
// VERIFICAR QUE SEA ADMIN (para admin.html)
// ===============================
function soloAdmin() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        alert("Debes iniciar sesión");
        window.location.href = "/login.html";
        return;
    }

    const API_BASE_URL = window.location.origin;

    fetch(`${API_BASE_URL}/api/usuarios/token/validar`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Token inválido");
        return res.json();
    })
    .then(data => {
        console.log("🔐 GUARD VALIDADO:", data);

        if (!data.usuario) {
            throw new Error("Sin usuario");
        }

        const rol = String(data.usuario.rol || "").toLowerCase().trim();

        console.log("👑 ROL GUARD:", rol);

        if (rol !== "admin" && rol !== "superadmin") {
            alert("Acceso solo para administradores");
            window.location.href = "/index.html";
        }
    })
    .catch(() => {
        cerrarSesion();
    });
}

// ===============================
// MOSTRAR NOMBRE DEL USUARIO EN EL NAVBAR (VERSIÓN BONITA)
// ===============================
function mostrarUsuario() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const authLink = document.getElementById("authLink");
    
    if (authLink) {
        if (usuario.nombre) {
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
                <a href="/login.html" class="btn-login-nav">
                    <span>🔐 Iniciar sesión</span>
                </a>
            `;
        }
    }
}

// ===============================
// PROTEGER PÁGINAS AUTOMÁTICAMENTE
// ===============================
const paginasPublicas = ["login.html", "registro.html", "recuperar.html"];
const paginaActual = window.location.pathname.split("/").pop();

if (paginaActual === "admin.html") {
    soloAdmin();
} else if (!paginasPublicas.includes(paginaActual)) {
    verificarSesion();
}

document.addEventListener("DOMContentLoaded", mostrarUsuario);