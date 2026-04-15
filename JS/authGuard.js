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
    
    // Verificar expiración del token
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

    // Usar la URL base automática (funciona en local y producción)
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

        const rol = String(data.usuario.rol || "")
            .toLowerCase()
            .trim();

        console.log("👑 ROL GUARD:", rol);

        if (rol !== "admin" && rol !== "superadmin") {
            alert("Acceso solo para administradores");
            window.location.href = "/index.html";
        }
    })
    .catch(() => {
        localStorage.clear();
        window.location.href = "/login.html";
    });
}

// ===============================
// MOSTRAR NOMBRE DEL USUARIO EN EL NAVBAR
// ===============================
function mostrarUsuario() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const authLink = document.getElementById("authLink");
    
    if (authLink) {
        if (usuario.nombre) {
            authLink.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>🐾 Hola, ${usuario.nombre}</span>
                    <button onclick="cerrarSesion()" style="background: none; border: 1px solid white; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Salir</button>
                </div>
            `;
        } else {
            authLink.innerHTML = `<a href="/login.html">Iniciar sesión</a>`;
        }
    }
}

// ===============================
// PROTEGER PÁGINAS AUTOMÁTICAMENTE
// ===============================
const paginasPublicas = ["login.html", "registro.html", "recuperar.html"];
const paginaActual = window.location.pathname.split("/").pop();

// Si es admin.html, verificar rol de admin
if (paginaActual === "admin.html") {
    soloAdmin();
} 
// Si no es página pública, verificar sesión
else if (!paginasPublicas.includes(paginaActual)) {
    verificarSesion();
}

// Mostrar usuario en todas las páginas
document.addEventListener("DOMContentLoaded", mostrarUsuario);