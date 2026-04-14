document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");
  const authLink = document.getElementById("authLink");

  if (!authLink) return;

  // =========================
  // NO LOGUEADO
  // =========================
  if (!token) {
    authLink.innerHTML = `<a href="login.html" class="btn-login-nav">🔐 Iniciar sesión</a>`;
    return;
  }

  // =========================
  // VALIDAR TOKEN (🔥 CLAVE)
  // =========================
  fetch("http://localhost:3000/api/usuarios/token/validar", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Token inválido");
    return res.json();
  })
  .then(data => {

    console.log("AUTH VALIDADO:", data);

    if (!data.usuario) return;

    const usuario = data.usuario;

    const rol = String(usuario.rol || "")
      .toLowerCase()
      .trim();

    console.log("👑 ROL AUTH:", rol);

    // Guardar usuario en localStorage para otros scripts
    localStorage.setItem("usuario", JSON.stringify(usuario));

    // =========================
    // MOSTRAR USUARIO CON ESTILO MEJORADO
    // =========================
    authLink.innerHTML = `
      <div class="user-menu">
        <div class="user-info">
          <div class="user-avatar">${usuario.nombre.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <span class="user-name">${usuario.nombre}</span>
            <span class="user-role">${rol === "admin" ? "👑 Administrador" : rol === "superadmin" ? "⭐ Super Admin" : "🐾 Usuario"}</span>
          </div>
        </div>
        <button id="logoutBtn" class="btn-logout">
          <span class="logout-icon"></span>
          <span class="logout-text">Salir</span>
        </button>
      </div>
    `;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
      });
    }

    // =========================
    // CONTROL ADMIN REAL 🔥
    // =========================
    if (rol === "admin" || rol === "superadmin") {
      document.querySelectorAll(".admin-only").forEach(el => {
        el.style.display = "block";
      });
    } else {
      document.querySelectorAll(".admin-only").forEach(el => {
        el.style.display = "none";
      });
    }

  })
  .catch(() => {
    console.warn("❌ Token inválido");
    localStorage.clear();
    window.location.href = "login.html";
  });

});

// =========================
// FUNCIÓN GLOBAL PARA CERRAR SESIÓN
// =========================
window.cerrarSesion = function() {
  localStorage.clear();
  window.location.href = "login.html";
};

// =========================
// FUNCIÓN GLOBAL PARA OBTENER TOKEN
// =========================
window.getToken = function() {
  return localStorage.getItem("token");
};

// =========================
// FUNCIÓN GLOBAL PARA OBTENER USUARIO
// =========================
window.getUsuario = function() {
  return JSON.parse(localStorage.getItem("usuario") || "{}");
};