// auth.js - Verificar que no cierre sesión erróneamente
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const authLink = document.getElementById("authLink");
    if (!authLink) return;

    if (!token) {
        authLink.innerHTML = `<a href="login.html">Iniciar sesión</a>`;
        return;
    }

    fetch("https://refugio-animales.onrender.com/api/usuarios/token/validar", {
        headers: { "Authorization": "Bearer " + token }
    })
    .then(res => {
        if (!res.ok) throw new Error("Token inválido");
        return res.json();
    })
    .then(data => {
        if (data.usuario) {
            const usuario = data.usuario;
            const rol = usuario.rol || "usuario";
            authLink.innerHTML = `
                <span>👤 ${usuario.nombre}</span>
                <button onclick="localStorage.clear(); window.location.href='login.html'">Salir</button>
            `;
            if (rol === "admin") {
                authLink.innerHTML += `<a href="admin.html">Admin</a>`;
            }
        }
    })
    .catch(() => {
        console.log("Token inválido, cerrando sesión");
        localStorage.clear();
        window.location.href = "login.html";
    });
});