// admin.js - Panel de administración

let animalesGlobal = [];
let csrfToken = "";
const API_BASE_URL = window.location.origin;

function escaparHTML(texto) {
    if (!texto) return "";
    return texto.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ===============================
// 🔐 OBTENER CSRF TOKEN
// ===============================
async function obtenerCSRF() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
            credentials: "include"
        });
        const data = await res.json();
        csrfToken = data.csrfToken;
        console.log("✅ CSRF Token obtenido");
    } catch (error) {
        console.error("Error CSRF:", error);
    }
}

// ===============================
// ✅ VERIFICAR TOKEN
// ===============================
async function verificarToken() {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/token/validar`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        return res.ok;
    } catch {
        return false;
    }
}

// ===============================
// 📥 CARGAR ANIMALES
// ===============================
async function cargarAnimales() { 
    try { 
        const res = await fetch(`${API_BASE_URL}/animales`);
        if (!res.ok) throw new Error("Error al cargar animales");
        animalesGlobal = await res.json(); 
        mostrarAnimales(animalesGlobal); 
        console.log("✅ Animales cargados:", animalesGlobal.length);
    } catch (error) { 
        console.error("Error cargando animales:", error);
        const lista = document.getElementById("listaAnimales");
        if (lista) lista.innerHTML = "<p>Error al cargar animales</p>";
    } 
}

// ===============================
// 🖥️ CARGAR SESIONES
// ===============================
async function cargarSesiones() {
    const contenedor = document.getElementById("sesiones");
    if (!contenedor) return;
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
        contenedor.innerHTML = "<p>No autorizado</p>";
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/sessions`, {
            method: "GET",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "CSRF-Token": csrfToken
            }
        });
        
        if (res.status === 401 || res.status === 403) {
            contenedor.innerHTML = "<p>Sesión expirada. <a href='login.html'>Inicia sesión nuevamente</a></p>";
            return;
        }
        
        if (!res.ok) throw new Error("Error al cargar sesiones");
        const data = await res.json();
        
        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p>No hay sesiones activas</p>";
            return;
        }
        contenedor.innerHTML = data.map(s => `
            <div class="card-admin-session">
                <p><strong>👤 Usuario:</strong> ${escaparHTML(s.nombre)} (${escaparHTML(s.email)})</p>
                <p><strong>🌐 IP:</strong> ${escaparHTML(s.ip)}</p>
                <button onclick="cerrarSesionUsuario(${s.id})" class="btn-eliminar">🔒 Cerrar sesión</button>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = "<p>Error al cargar sesiones</p>";
    }
}

// ===============================
// 👥 CARGAR USUARIOS
// ===============================
async function cargarUsuarios() {
    const contenedor = document.getElementById("usuarios");
    if (!contenedor) return;
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
        contenedor.innerHTML = "<p>No autorizado</p>";
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/todos`, {
            method: "GET",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "CSRF-Token": csrfToken
            }
        });
        
        if (res.status === 401 || res.status === 403) {
            contenedor.innerHTML = "<p>Sesión expirada. <a href='login.html'>Inicia sesión nuevamente</a></p>";
            return;
        }
        
        if (!res.ok) throw new Error("Error al cargar usuarios");
        const data = await res.json();
        
        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p>No hay usuarios</p>";
            return;
        }
        contenedor.innerHTML = data.map(u => `
            <div class="card-admin-user">
                <p><strong>${escaparHTML(u.nombre)}</strong> (${escaparHTML(u.email)})</p>
                <p><strong>Rol:</strong> ${escaparHTML(u.rol)} | <strong>Estado:</strong> ${u.activo ? '✅ Activo' : '❌ Bloqueado'}</p>
                ${u.rol !== "admin" ? `<button onclick="bloquearUsuario(${u.id})" class="btn-eliminar">🔒 Bloquear</button>` : ""}
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = "<p>Error al cargar usuarios</p>";
    }
}

// ===============================
// 🐾 CARGAR ADOPCIONES
// ===============================
async function cargarAdopciones() {
    const contenedor = document.getElementById("adopciones");
    if (!contenedor) return;
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
        contenedor.innerHTML = "<p>No autorizado</p>";
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/adopciones`, {
            method: "GET",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "CSRF-Token": csrfToken
            }
        });
        
        if (res.status === 401 || res.status === 403) {
            contenedor.innerHTML = "<p>Sesión expirada. <a href='login.html'>Inicia sesión nuevamente</a></p>";
            return;
        }
        
        if (!res.ok) throw new Error("Error al cargar adopciones");
        const data = await res.json();
        
        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p>No hay solicitudes de adopción</p>";
            return;
        }
        contenedor.innerHTML = data.map(a => `
            <div class="card-admin-adopcion">
                <p><strong>${escaparHTML(a.usuario_nombre)}</strong> quiere adoptar <strong>${escaparHTML(a.animal_nombre)}</strong></p>
                <p>📧 ${escaparHTML(a.email)} | 📱 ${escaparHTML(a.telefono)}</p>
                <p>Estado: <strong>${escaparHTML(a.estado)}</strong></p>
                ${a.estado === "pendiente" ? `
                    <div>
                        <button onclick="aprobarAdopcion(${a.id})" class="btn-aprobar">✅ Aprobar</button>
                        <button onclick="rechazarAdopcion(${a.id})" class="btn-rechazar">❌ Rechazar</button>
                    </div>
                ` : ""}
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = "<p>Error al cargar solicitudes</p>";
    }
}

// ===============================
// 🖼️ MOSTRAR ANIMALES
// ===============================
function mostrarAnimales(animales) {
    const lista = document.getElementById("listaAnimales");
    if (!lista) return;
    lista.innerHTML = "";
    if (!animales || animales.length === 0) { 
        lista.innerHTML = "<p>No hay animales registrados</p>"; 
        return; 
    }
    animales.forEach(a => {
        lista.innerHTML += `<div class="card-admin" data-id="${a.id}">
            <div class="card-img"><img src="${a.imagen_url || '/img/perro.png'}" onerror="this.src='${API_BASE_URL}/img/perro.png'"></div>
            <div class="card-info">
                <h3>${escaparHTML(a.nombre)} <span class="tipo-badge">${escaparHTML(a.tipo)}</span></h3>
                <p><strong>Edad:</strong> ${escaparHTML(a.edad)} años</p>
                <p><strong>Raza:</strong> ${escaparHTML(a.raza)}</p>
                <p><strong>Estado:</strong> ${escaparHTML(a.estado)}</p>
                <div class="card-acciones">
                    <button onclick="editarAnimal(${a.id})" class="btn-editar">✏️ Editar</button>
                    <button onclick="eliminarAnimal(${a.id})" class="btn-eliminar">🗑️ Eliminar</button>
                </div>
            </div>
        </div>`;
    });
}

// ===============================
// 📸 SUBIR IMAGEN
// ===============================
async function subirImagen(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('imagen', file);
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("No hay sesión activa");
        return null;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "CSRF-Token": csrfToken
            },
            body: formData
        });
        
        if (res.status === 401 || res.status === 403) {
            alert("Sesión expirada. Inicia sesión nuevamente.");
            cerrarSesionAdmin();
            return null;
        }
        
        if (!res.ok) throw new Error("Error al subir");
        const data = await res.json();
        return data.url;
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        alert("Error al subir la imagen: " + error.message);
        return null;
    }
}

// ===============================
// 🚀 INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Inicializando panel de admin...");
    
    // 🔥 OBTENER CSRF TOKEN PRIMERO
    await obtenerCSRF();
    
    const token = localStorage.getItem("accessToken");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    
    if (!token) {
        alert("Debes iniciar sesión");
        window.location.href = "/login.html";
        return;
    }
    
    if (usuario.rol !== "admin" && usuario.rol !== "superadmin") {
        alert("Acceso solo para administradores");
        window.location.href = "/index.html";
        return;
    }
    
    // Mostrar nombre del admin
    const authLink = document.getElementById("authLink");
    if (authLink && usuario.nombre) {
        authLink.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>🐾 Hola, ${usuario.nombre}</span>
                <button onclick="cerrarSesionAdmin()" class="btn-cerrar-sesion" style="background: none; border: 1px solid white; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Salir</button>
            </div>
        `;
    }
    
    // Cargar datos
    await cargarAnimales();
    await cargarSesiones();
    await cargarUsuarios();
    await cargarAdopciones();
    
    // Configurar formulario
    const form = document.getElementById("formAnimal");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("id").value;
            const imagenFile = document.getElementById("imagen")?.files[0];
            
            let imagenUrl = null;
            if (imagenFile) {
                imagenUrl = await subirImagen(imagenFile);
                if (!imagenUrl) return;
            }

            const animal = { 
                tipo: document.getElementById("tipo").value,
                nombre: document.getElementById("nombre").value,
                edad: document.getElementById("edad").value,
                raza: document.getElementById("raza").value,
                comportamiento: document.getElementById("comportamiento").value,
                vacunas: document.getElementById("vacunas").value,
                enfermedades: document.getElementById("enfermedades").value,
                descripcion: document.getElementById("descripcion").value,
                estado: document.getElementById("estado").value
            };
            if (imagenUrl) animal.imagen_url = imagenUrl;
            
            const token = localStorage.getItem("accessToken");
            try {
                let res;
                if (id) {
                    res = await fetch(`${API_BASE_URL}/admin/animales/${id}`, {
                        method: "PUT",
                        credentials: "include",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                            "CSRF-Token": csrfToken
                        },
                        body: JSON.stringify(animal)
                    });
                } else {
                    res = await fetch(`${API_BASE_URL}/admin/animales`, {
                        method: "POST",
                        credentials: "include",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                            "CSRF-Token": csrfToken
                        },
                        body: JSON.stringify(animal)
                    });
                }
                if (!res.ok) throw new Error("Error al guardar");
                alert("✅ Guardado correctamente");
                form.reset();
                document.getElementById("id").value = "";
                document.getElementById("imagen").value = "";
                cargarAnimales();
            } catch (error) {
                alert("Error al guardar: " + error.message);
            }
        });
    }
    
    // Filtros
    const buscador = document.getElementById("buscador");
    const filtroTipo = document.getElementById("filtroTipo");
    const filtroEstado = document.getElementById("filtroEstado");
    const btnFiltrar = document.getElementById("btnFiltrar");
    
    if (buscador) {
        buscador.addEventListener("input", () => {
            const texto = buscador.value.toLowerCase();
            const filtrados = animalesGlobal.filter(a => 
                a.nombre.toLowerCase().includes(texto) || 
                (a.raza && a.raza.toLowerCase().includes(texto))
            );
            mostrarAnimales(filtrados);
        });
    }
    
    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", () => {
            let filtrados = animalesGlobal;
            if (filtroTipo?.value) filtrados = filtrados.filter(a => a.tipo === filtroTipo.value);
            if (filtroEstado?.value) filtrados = filtrados.filter(a => a.estado === filtroEstado.value);
            mostrarAnimales(filtrados);
        });
    }
    
    // Botón cerrar sesión
    const btnCerrar = document.getElementById("btnCerrarSesion");
    if (btnCerrar) {
        btnCerrar.onclick = cerrarSesionAdmin;
    }
});

// ===============================
// FUNCIONES GLOBALES
// ===============================
function cerrarSesionAdmin() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("usuario");
    window.location.href = "/login.html";
}

window.editarAnimal = function(id) { 
    window.location.href = `editar.html?id=${id}`; 
};

// ===============================
// 🗑️ ELIMINAR ANIMAL (CON CSRF)
// ===============================
window.eliminarAnimal = async function(id) { 
    if (!confirm("¿Eliminar este animal?")) return;
    const token = localStorage.getItem("accessToken");
    if (!token) { cerrarSesionAdmin(); return; }
    
    try {
        const res = await fetch(`${API_BASE_URL}/admin/animales/${id}`, { 
            method: "DELETE",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            }
        });
        
        if (res.status === 401 || res.status === 403) {
            alert("Sesión expirada o no autorizado. Inicia sesión nuevamente.");
            cerrarSesionAdmin();
            return;
        }
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Error al eliminar");
        }
        
        alert("✅ Animal eliminado");
        location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    } 
};

// ===============================
// 🔒 BLOQUEAR USUARIO (CON CSRF)
// ===============================
window.bloquearUsuario = async function(id) { 
    if (!confirm("¿Bloquear este usuario?")) return;
    const token = localStorage.getItem("accessToken");
    if (!token) { cerrarSesionAdmin(); return; }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/bloquear/${id}`, { 
            method: "PUT",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            }
        });
        if (!res.ok) throw new Error("Error al bloquear");
        alert("✅ Usuario bloqueado");
        location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// ===============================
// 🔒 CERRAR SESIÓN DE USUARIO (CON CSRF)
// ===============================
window.cerrarSesionUsuario = async function(id) { 
    if (!confirm("¿Cerrar esta sesión?")) return;
    const token = localStorage.getItem("accessToken");
    if (!token) { cerrarSesionAdmin(); return; }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/sessions/${id}`, { 
            method: "DELETE",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            }
        });
        if (!res.ok) throw new Error("Error al cerrar sesión");
        alert("✅ Sesión cerrada");
        location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// ===============================
// ✅ APROBAR ADOPCIÓN (CON CSRF)
// ===============================
window.aprobarAdopcion = async function(id) { 
    const token = localStorage.getItem("accessToken");
    if (!token) { cerrarSesionAdmin(); return; }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/adopciones/aprobar/${id}`, { 
            method: "PUT",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            }
        });
        if (!res.ok) throw new Error("Error al aprobar");
        alert("✅ Adopción aprobada"); 
        location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// ===============================
// ❌ RECHAZAR ADOPCIÓN (CON CSRF)
// ===============================
window.rechazarAdopcion = async function(id) { 
    const token = localStorage.getItem("accessToken");
    if (!token) { cerrarSesionAdmin(); return; }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/adopciones/rechazar/${id}`, { 
            method: "PUT",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            }
        });
        if (!res.ok) throw new Error("Error al rechazar");
        alert("❌ Adopción rechazada"); 
        location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
};