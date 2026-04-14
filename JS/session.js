console.log("session.js cargado");

// const API_URL = "http://localhost:3000";

// 🔐 VALIDAR SESIÓN EN TODAS LAS PÁGINAS
async function validarSesion() {

    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {
        const res = await fetch(`${API_URL}/api/token/validar`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!res.ok) throw new Error("Token inválido");

        const data = await res.json();

        console.log("✅ Sesión válida:", data);

        return data.usuario;

    } catch (error) {
        console.warn("❌ Sesión inválida");
        localStorage.removeItem("token");
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
            <span>👤 ${usuario.nombre || "Usuario " + usuario.id}</span>
            <button onclick="logout()">Salir</button>
        `;
    } else {
        authLink.innerHTML = `
            <a href="login.html">Iniciar sesión</a>
        `;
    }
}


// 🔓 LOGOUT GLOBAL
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "index.html";
}


// 🔐 PROTEGER PÁGINAS (OPCIONAL)
async function protegerPagina() {

    const usuario = await validarSesion();

    if (!usuario) {
        alert("Debes iniciar sesión");
        window.location.href = "login.html";
    }
}


// 🚀 INICIAR AUTOMÁTICO
document.addEventListener("DOMContentLoaded", cargarUsuarioUI);