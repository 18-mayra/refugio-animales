// admin.js - Panel de administración

let animalesGlobal = [];
let csrfToken = "";

function escaparHTML(texto) {
    if (!texto) return "";
    return texto.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function obtenerCSRF() {
    try {
        const res = await fetch("http://localhost:3000/api/csrf-token", { credentials: "include" });
        const data = await res.json();
        csrfToken = data.csrfToken;
        console.log("✅ CSRF Token obtenido");
    } catch (error) { console.error("Error CSRF:", error); }
}

async function subirImagen(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('imagen', file);
    try {
        const token = localStorage.getItem("token");
        console.log("📡 Subiendo imagen:", file.name);
        
        const res = await fetch("http://localhost:3000/api/admin/upload", {
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
        return "http://localhost:5500/img/perro.png";
    }
    if (imagenUrl.startsWith('/uploads/')) {
        return `http://localhost:3000${imagenUrl}`;
    }
    if (imagenUrl.startsWith('img/')) {
        return `http://localhost:5500/${imagenUrl}`;
    }
    if (imagenUrl.startsWith('http')) {
        return imagenUrl;
    }
    return "http://localhost:5500/img/perro.png";
}

document.addEventListener("DOMContentLoaded", async () => {
    await obtenerCSRF();
    const token = localStorage.getItem("token");
    if (!token) { alert("Debes iniciar sesión"); window.location.href = "login.html"; return; }
    try {
        const data = await API.request("/api/usuarios/token/validar");
        const usuario = data.usuario || data.user;
        if (!usuario) throw new Error("Token inválido");
        const rol = String(usuario.rol || "").toLowerCase().trim();
        if (!rol.includes("admin")) { alert("Acceso solo para administradores"); localStorage.clear(); window.location.href = "login.html"; return; }
        iniciarAdmin();
    } catch (error) { console.error(error); localStorage.clear(); window.location.href = "login.html"; }
});

function iniciarAdmin() {
    const form = document.getElementById("formAnimal");
    const lista = document.getElementById("listaAnimales");
    const buscador = document.getElementById("buscador");
    const tipo = document.getElementById("tipo"), nombre = document.getElementById("nombre"), edad = document.getElementById("edad");
    const raza = document.getElementById("raza"), comportamiento = document.getElementById("comportamiento");
    const vacunas = document.getElementById("vacunas"), enfermedades = document.getElementById("enfermedades");
    const descripcion = document.getElementById("descripcion"), estado = document.getElementById("estado");
    const filtroTipo = document.getElementById("filtroTipo"), filtroEstado = document.getElementById("filtroEstado");

    async function cargarAnimales() { 
        try { 
            animalesGlobal = await API.obtenerAnimales(); 
            mostrarAnimales(animalesGlobal); 
        } catch (error) { console.error(error); } 
    }
    
    async function cargarSesiones() {
        const contenedor = document.getElementById("sesiones");
        if (!contenedor) return;
        try {
            const data = await API.request("/api/usuarios/sessions");
            if (!data || data.length === 0) {
                contenedor.innerHTML = "<h2>🖥️ Sesiones activas</h2><p>No hay sesiones activas</p>";
                return;
            }
            contenedor.innerHTML = `<h2>🖥️ Sesiones activas (${data.length})</h2>` + 
                data.map(s => `<div class="card-admin-session">
                    <p><strong>👤 Usuario:</strong> ${escaparHTML(s.nombre)} (${escaparHTML(s.email)})</p>
                    <p><strong>🌐 IP:</strong> ${escaparHTML(s.ip)}</p>
                    <button onclick="window.cerrarSesion(${s.id})" class="btn-eliminar">🔒 Cerrar sesión</button>
                </div>`).join('');
        } catch (error) {
            contenedor.innerHTML = "<h2>🖥️ Sesiones activas</h2><p>Error al cargar</p>";
        }
    }
    
    async function cargarUsuarios() {
        const contenedor = document.getElementById("usuarios");
        if (!contenedor) return;
        try {
            const data = await API.request("/api/usuarios/todos");
            if (!data || data.length === 0) {
                contenedor.innerHTML = "<h2>👥 Usuarios registrados</h2><p>No hay usuarios</p>";
                return;
            }
            contenedor.innerHTML = `<h2>👥 Usuarios registrados (${data.length})</h2>` + 
                data.map(u => `<div class="card-admin-user">
                    <p><strong>${escaparHTML(u.nombre)}</strong> (${escaparHTML(u.email)})</p>
                    <p><strong>Rol:</strong> ${escaparHTML(u.rol)} | <strong>Estado:</strong> ${u.activo ? '✅ Activo' : '❌ Bloqueado'}</p>
                    <button onclick="window.bloquearUsuario(${u.id})" class="btn-eliminar">🔒 Bloquear</button>
                </div>`).join('');
        } catch (error) {
            contenedor.innerHTML = "<h2>👥 Usuarios registrados</h2><p>Error al cargar</p>";
        }
    }
    
    async function cargarAdopciones() {
        const contenedor = document.getElementById("adopciones");
        if (!contenedor) return;
        try {
            const data = await API.request("/api/adopciones");
            if (!data || data.length === 0) {
                contenedor.innerHTML = "<h2>🐾 Solicitudes de adopción</h2><p>No hay solicitudes</p>";
                return;
            }
            contenedor.innerHTML = `<h2>🐾 Solicitudes de adopción (${data.length})</h2>` + 
                data.map(a => `<div class="card-admin-adopcion">
                    <p><strong>${escaparHTML(a.usuario_nombre)}</strong> quiere adoptar <strong>${escaparHTML(a.animal_nombre)}</strong></p>
                    <p>📧 ${escaparHTML(a.email)} | 📱 ${escaparHTML(a.telefono)}</p>
                    <p>Estado: <strong>${escaparHTML(a.estado)}</strong></p>
                    ${a.estado === "pendiente" ? `<div><button onclick="window.aprobar(${a.id})" class="btn-aprobar">✅ Aprobar</button> <button onclick="window.rechazar(${a.id})" class="btn-rechazar">❌ Rechazar</button></div>` : ""}
                </div>`).join('');
        } catch (error) {
            contenedor.innerHTML = "<h2>🐾 Solicitudes de adopción</h2><p>Error al cargar</p>";
        }
    }
    
    function mostrarAnimales(animales) {
        if (!lista) return;
        lista.innerHTML = "";
        if (!animales?.length) { lista.innerHTML = "<p>No hay animales registrados</p>"; return; }
        animales.forEach(a => {
            lista.innerHTML += `<div class="card-admin">
                <div class="card-img"><img src="${getImagenUrl(a.imagen_url)}" onerror="this.src='http://localhost:5500/img/perro.png'"></div>
                <div class="card-info">
                    <h3>${escaparHTML(a.nombre)} <span class="tipo-badge">${escaparHTML(a.tipo)}</span></h3>
                    <p><strong>Edad:</strong> ${escaparHTML(a.edad)} años</p>
                    <p><strong>Raza:</strong> ${escaparHTML(a.raza)}</p>
                    <p><strong>Estado:</strong> ${escaparHTML(a.estado)}</p>
                    <div class="card-acciones">
                        <button onclick="window.editarAnimal(${a.id})" class="btn-editar">✏️ Editar</button>
                        <button onclick="window.eliminarAnimal(${a.id})" class="btn-eliminar">🗑️ Eliminar</button>
                    </div>
                </div>
            </div>`;
        });
    }

    cargarAnimales();
    cargarSesiones();
    cargarUsuarios();
    cargarAdopciones();

    document.getElementById("btnCerrarSesion")?.addEventListener("click", () => { localStorage.clear(); window.location.href = "login.html"; });

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("id").value;
        const imagenFile = document.getElementById("imagen")?.files[0];
        
        let imagenUrl = null;
        if (imagenFile) {
            imagenUrl = await subirImagen(imagenFile);
            if (!imagenUrl) { alert("Error al subir la imagen"); return; }
        }

        const animal = { 
            tipo: tipo.value, nombre: nombre.value, edad: edad.value, 
            raza: raza.value, comportamiento: comportamiento.value, 
            vacunas: vacunas.value, enfermedades: enfermedades.value, 
            descripcion: descripcion.value, estado: estado.value 
        };
        if (imagenUrl) animal.imagen_url = imagenUrl;
        
        try {
            if (id) await API.actualizarAnimal(id, animal);
            else await API.crearAnimal(animal);
            alert("✅ Guardado correctamente");
            form.reset();
            document.getElementById("id").value = "";
            document.getElementById("imagen").value = "";
            cargarAnimales();
        } catch (error) { alert("Error al guardar: " + error.message); }
    });

    if (buscador) buscador.addEventListener("input", () => {
        const texto = buscador.value.toLowerCase();
        const filtrados = animalesGlobal.filter(a => a.nombre.toLowerCase().includes(texto) || a.raza?.toLowerCase().includes(texto));
        mostrarAnimales(filtrados);
    });

    document.getElementById("btnFiltrar")?.addEventListener("click", () => {
        let filtrados = animalesGlobal;
        if (filtroTipo?.value) filtrados = filtrados.filter(a => a.tipo === filtroTipo.value);
        if (filtroEstado?.value) filtrados = filtrados.filter(a => a.estado === filtroEstado.value);
        mostrarAnimales(filtrados);
    });
}

window.editarAnimal = function(id) { window.location.href = `editar.html?id=${id}`; };

window.eliminarAnimal = async function(id) { 
    if (confirm("¿Eliminar este animal?")) { 
        await API.request(`/admin/animales/${id}`, { method: "DELETE" }); 
        location.reload(); 
    } 
};

window.bloquearUsuario = async function(id) { 
    if (confirm("¿Bloquear este usuario?")) { 
        await API.request(`/api/usuarios/bloquear/${id}`, { method: "PUT" }); 
        location.reload(); 
    } 
};

window.cerrarSesion = async function(id) { 
    if (confirm("¿Cerrar esta sesión?")) { 
        await API.request(`/api/sessions/${id}`, { method: "DELETE" }); 
        location.reload(); 
    } 
};

window.aprobar = async function(id) { 
    await API.aprobarAdopcion(id); 
    alert("✅ Adopción aprobada"); 
    location.reload(); 
};

window.rechazar = async function(id) { 
    await API.rechazarAdopcion(id); 
    alert("❌ Adopción rechazada"); 
    location.reload(); 
};