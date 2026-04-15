console.log("session.js cargado");

const API_BASE_URL = window.location.origin;

// 🔐 VALIDAR SESIÓN EN TODAS LAS PÁGINAS
async function validarSesion() {

    const token = localStorage.getItem("accessToken");

    if (!token) {
        return null;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/token/validar`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!res.ok) throw new Error("Token inválido");

        const data = await res.json();

        console.log("✅ Sesión válida:", data.usuario);

        return data.usuario;

    } catch (error) {
        console.warn("❌ Sesión inválida:", error.message);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("usuario");
        return null;
    }
}

// 👤 MOSTRAR USUARIO EN MENÚ
async function cargarUsuarioUI() {

    const authLink = document.getElementById("authLink");
    if (!authLink) return;

    const usuario = await validarSesion();

    if (usuario) {
        authLink.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>🐾 Hola, ${usuario.nombre || "Usuario"}</span>
                <button onclick="logout()" style="background: #f44336; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Salir</button>
            </div>
        `;
    } else {
        authLink.innerHTML = `
            <a href="login.html" style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 8px 20px; border-radius: 30px; color: white; text-decoration: none;">Iniciar sesión</a>
        `;
    }
}

// 🔓 LOGOUT GLOBAL
function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("usuario");
    window.location.href = "index.html";
}

// 🔐 PROTEGER PÁGINAS (OPCIONAL)
async function protegerPagina() {

    const usuario = await validarSesion();

    if (!usuario) {
        alert("Debes iniciar sesión");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// 👑 PROTEGER PÁGINA DE ADMIN
async function protegerAdmin() {
    const usuario = await validarSesion();
    
    if (!usuario) {
        alert("Debes iniciar sesión");
        window.location.href = "login.html";
        return false;
    }
    
    if (usuario.rol !== "admin" && usuario.rol !== "superadmin") {
        alert("Acceso solo para administradores");
        window.location.href = "index.html";
        return false;
    }
    
    return true;
}

// 🚀 INICIAR AUTOMÁTICO
document.addEventListener("DOMContentLoaded", cargarUsuarioUI);