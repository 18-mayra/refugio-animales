document.addEventListener("DOMContentLoaded", cargarSesiones);

const API_BASE_URL = window.location.origin;

async function cargarSesiones() {
    const token = localStorage.getItem("accessToken");
    const contenedor = document.getElementById("sesiones");
    
    if (!contenedor) return;
    
    // Verificar que sea admin
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (usuario.rol !== "admin" && usuario.rol !== "superadmin") {
        contenedor.innerHTML = "<p>No tienes permisos para ver sesiones</p>";
        return;
    }
    
    if (!token) {
        contenedor.innerHTML = "<p>No has iniciado sesión</p>";
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/sessions`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (!res.ok) throw new Error("Error al cargar sesiones");
        
        const data = await res.json();
        
        contenedor.innerHTML = "";
        
        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p>No hay sesiones activas</p>";
            return;
        }
        
        data.forEach(s => {
            contenedor.innerHTML += `
                <div class="card-session">
                    <p><strong>IP:</strong> ${s.ip || 'Desconocida'}</p>
                    <p><strong>Usuario:</strong> ${s.nombre || 'N/A'}</p>
                    <p><strong>Email:</strong> ${s.email || 'N/A'}</p>
                    <button onclick="cerrarSesion(${s.id})" class="btn-eliminar">Cerrar sesión</button>
                </div>
            `;
        });
        
    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<p>Error al cargar sesiones: ${error.message}</p>`;
    }
}

async function cerrarSesion(id) {
    const token = localStorage.getItem("accessToken");
    
    if (!confirm("¿Cerrar esta sesión?")) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/sessions/${id}`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (!res.ok) throw new Error("Error al cerrar sesión");
        
        alert("✅ Sesión cerrada correctamente");
        cargarSesiones(); // Recargar lista
        
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error: " + error.message);
    }
}