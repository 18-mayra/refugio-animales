// admin.js - Panel de administración

let animalesGlobal = [];
let csrfToken = "";

const API_BASE_URL = window.location.origin;

function escaparHTML(texto) {
    if (!texto) return "";
    return texto.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function obtenerCSRF() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        csrfToken = data.csrfToken;
        console.log("✅ CSRF Token obtenido");
    } catch (error) { 
        console.error("Error CSRF:", error); 
    }
}

async function subirImagen(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('imagen', file);
    try {
        const token = localStorage.getItem("accessToken");
        console.log("📡 Subiendo imagen:", file.name);
        
        const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        console.log("✅ Imagen subida:", data.url);
        return data.url;
    } catch (error) {
        console.error("❌ Error subiendo imagen:", error);
        alert("Error al subir la imagen: " + error.message);
        return null;
    }
}

function getImagenUrl(imagenUrl) {
    if (!imagenUrl || imagenUrl === '/img/default.png') {
        return `${API_BASE_URL}/img/perro.png`;
    }
    if (imagenUrl.startsWith('/uploads/')) {
        return `${API_BASE_URL}${imagenUrl}`;
    }
    if (imagenUrl.startsWith('img/')) {
        return `${API_BASE_URL}/${imagenUrl}`;
    }
    if (imagenUrl.startsWith('http')) {
        return imagenUrl;
    }
    return `${API_BASE_URL}/img/perro.png`;
}

async function cargarAnimales() { 
    try { 
        const res = await fetch(`${API_BASE_URL}/animales`);
        if (!res.ok) throw new Error("Error al cargar animales");
        animalesGlobal = await res.json(); 
        mostrarAnimales(animalesGlobal); 
        console.log("✅ Animales cargados:", animalesGlobal.length);
    } catch (error) { 
        console.error("Error cargando animales:", error);
        document.getElementById("listaAnimales").innerHTML = "<p>Error al cargar animales</p>";
    } 
}

async function cargarSesiones() {
    const contenedor = document.getElementById("sesiones");
    if (!contenedor) return;
    try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE_URL}/api/usuarios/sessions`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Error al cargar sesiones");
        const data = await res.json();
        
        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p>No hay sesiones activas</p>";
            return;
        }
        contenedor.innerHTML = `<h3>Sesiones activas (${data.length})</h3>` + 
            data.map(s => `
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

async function cargarUsuarios() {
    const contenedor = document.getElementById("usuarios");
    if (!contenedor) return;
    try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE_URL}/api/usuarios/todos`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Error al cargar usuarios");
        const data = await res.json();
        
        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p>No hay usuarios</p>";
            return;
        }
        contenedor.innerHTML = `<h3>Usuarios registrados (${data.length})</h3>` + 
            data.map(u => `
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

async function cargarAdopciones() {
    const contenedor = document.getElementById("adopciones");
    if (!contenedor) return;
    try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE_URL}/api/adopciones`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Error al cargar adopciones");
        const data = await res.json();
        
        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p>No hay solicitudes de adopción</p>";
            return;
        }
        contenedor.innerHTML = `<h3>Solicitudes de adopción (${data.length})</h3>` + 
            data.map(a => `
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

function mostrarAnimales(animales) {
    const lista = document.getElementById("listaAnimales");
    if (!lista) return;
    lista.innerHTML = "";
    if (!animales || animales.length === 0) { 
        lista.innerHTML = "<p>No hay animales registrados</p>"; 
        return; 
    }
    animales.forEach(a => {
        lista.innerHTML += `<div class="card-admin">
            <div class="card-img"><img src="${getImagenUrl(a.imagen_url)}" onerror="this.src='${API_BASE_URL}/img/perro.png'"></div>
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
// INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Inicializando panel de admin...");
    
    const token = localStorage.getItem("accessToken");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    
    console.log("Token:", token ? "SÍ" : "NO");
    console.log("Usuario rol:", usuario.rol);
    
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
                <button onclick="cerrarSesionAdmin()" style="background: none; border: 1px solid white; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Salir</button>
            </div>
        `;
    }
    
    await obtenerCSRF();
    
    // Cargar todos los datos
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
                if (!imagenUrl) { alert("Error al subir la imagen"); return; }
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
            
            try {
                const token = localStorage.getItem("accessToken");
                let res;
                if (id) {
                    res = await fetch(`${API_BASE_URL}/admin/animales/${id}`, {
                        method: "PUT",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify(animal)
                    });
                } else {
                    res = await fetch(`${API_BASE_URL}/admin/animales`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
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
    
    // Configurar filtros
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
        btnCerrar.onclick = () => {
            cerrarSesionAdmin();
        };
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

window.eliminarAnimal = async function(id) { 
    if (confirm("¿Eliminar este animal?")) { 
        const token = localStorage.getItem("accessToken");
        await fetch(`${API_BASE_URL}/admin/animales/${id}`, { 
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        }); 
        location.reload(); 
    } 
};

window.bloquearUsuario = async function(id) { 
    if (confirm("¿Bloquear este usuario?")) { 
        const token = localStorage.getItem("accessToken");
        await fetch(`${API_BASE_URL}/api/usuarios/bloquear/${id}`, { 
            method: "PUT",
            headers: { "Authorization": "Bearer " + token }
        }); 
        location.reload(); 
    } 
};

window.cerrarSesionUsuario = async function(id) { 
    if (confirm("¿Cerrar esta sesión?")) { 
        const token = localStorage.getItem("accessToken");
        await fetch(`${API_BASE_URL}/api/sessions/${id}`, { 
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        }); 
        location.reload(); 
    } 
};

window.aprobarAdopcion = async function(id) { 
    const token = localStorage.getItem("accessToken");
    await fetch(`${API_BASE_URL}/api/adopciones/aprobar/${id}`, { 
        method: "PUT",
        headers: { "Authorization": "Bearer " + token }
    }); 
    alert("✅ Adopción aprobada"); 
    location.reload(); 
};

window.rechazarAdopcion = async function(id) { 
    const token = localStorage.getItem("accessToken");
    await fetch(`${API_BASE_URL}/api/adopciones/rechazar/${id}`, { 
        method: "PUT",
        headers: { "Authorization": "Bearer " + token }
    }); 
    alert("❌ Adopción rechazada"); 
    location.reload(); 
};