console.log("APP B cargado");

const API_BASE_URL = window.location.origin;
const token = localStorage.getItem("accessToken");

if (!token) {
    alert("No hay sesión activa");
    window.location.href = "login.html";
}

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
    console.log("✅ SSO OK:", data.usuario);
    console.log(`👤 Bienvenido, ${data.usuario.nombre}`);
    console.log(`👑 Rol: ${data.usuario.rol}`);

    alert(`✅ Acceso correcto a App B\nBienvenido, ${data.usuario.nombre}`);
    
    // Opcional: mostrar contenido en lugar de redirigir automáticamente
    const contenedor = document.getElementById("contenido");
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2>✅ Autenticación exitosa</h2>
                <p>Usuario: ${data.usuario.nombre}</p>
                <p>Email: ${data.usuario.email}</p>
                <p>Rol: ${data.usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</p>
                <button onclick="window.location.href='index.html'" style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Volver al inicio
                </button>
            </div>
        `;
    }
    
    // Si quieres redirigir automáticamente después de unos segundos:
    // setTimeout(() => { window.location.href = "index.html"; }, 3000);
})
.catch((error) => {
    console.error("❌ Error:", error);
    alert("Sesión inválida o expirada");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
});