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

        authLink.innerHTML = `
            <div style="display:flex;gap:10px;align-items:center;">
                <span>👤 ${usuario.nombre}</span>

                ${usuario.rol === "admin" ? `
                    <a href="admin.html" style="background:green;color:white;padding:5px 10px;border-radius:10px;text-decoration:none;">
                        Admin
                    </a>` : ""
                }

                <button onclick="cerrarSesion()" style="background:red;color:white;border:none;padding:5px 10px;border-radius:10px;">
                    Salir
                </button>
            </div>
        `;
    } else {
        authLink.innerHTML = `
            <a href="login.html" style="padding:8px 15px;background:#667eea;color:white;border-radius:20px;text-decoration:none;">
                Iniciar sesión
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