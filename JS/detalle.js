// detalle.js - Página de detalles del animal

console.log("detalle.js cargado");

const API_URL = "https://refugio-animales.onrender.com";

// Obtener ID de la URL
const urlParams = new URLSearchParams(window.location.search);
const animalId = urlParams.get('id');

const contenedor = document.getElementById("detalle");

if (!animalId) {
    contenedor.innerHTML = "<p style='color:red'>ID no válido</p>";
    throw new Error("No hay ID en la URL");
}

function getImagenUrl(imagenUrl) {
    if (!imagenUrl) return "https://via.placeholder.com/500x400?text=Sin+Imagen";
    if (imagenUrl.startsWith('http')) return imagenUrl;
    if (imagenUrl.startsWith('/uploads/')) return API_URL + imagenUrl;
    if (imagenUrl.startsWith('img/')) return `/${imagenUrl}`;
    return "https://via.placeholder.com/500x400?text=Sin+Imagen";
}

function getEstadoBadge(estado) {
    const estadoLower = (estado || "").toLowerCase();
    if (estadoLower === "disponible") return '<span class="badge-disponible">✅ Disponible</span>';
    if (estadoLower === "adoptado") return '<span class="badge-adoptado">❤️ Adoptado</span>';
    return `<span class="badge">${estado}</span>`;
}

async function cargarDetalle() {
    try {
        const res = await fetch(`${API_URL}/animales/${animalId}`);
        
        if (!res.ok) {
            throw new Error("Animal no encontrado");
        }
        
        const animal = await res.json();
        const imgUrl = getImagenUrl(animal.imagen_url);
        
        contenedor.innerHTML = `
            <div class="detalle-card-moderno">
                <div class="detalle-imagen">
                    <img src="${imgUrl}" alt="${animal.nombre}" onerror="this.src='https://via.placeholder.com/500x400?text=Sin+Imagen'">
                </div>
                <div class="detalle-info-moderno">
                    <div class="detalle-titulo">
                        <h2>${animal.nombre}</h2>
                        <span class="tipo-icono">${animal.tipo === "Perro" ? "🐕" : "🐈"}</span>
                    </div>
                    <div class="detalle-estado">${getEstadoBadge(animal.estado)}</div>
                    <div class="detalle-grid">
                        <div class="detalle-item"><span class="item-label">🐾 Raza</span><span class="item-value">${animal.raza || "No especificada"}</span></div>
                        <div class="detalle-item"><span class="item-label">📅 Edad</span><span class="item-value">${animal.edad || "?"} años</span></div>
                    </div>
                    <div class="detalle-seccion"><h3>📝 Descripción</h3><p>${animal.descripcion || "Sin descripción disponible."}</p></div>
                    <div class="detalle-seccion"><h3>💉 Vacunas</h3><p>${animal.vacunas || "Información no disponible"}</p></div>
                    <div class="detalle-seccion"><h3>🩺 Enfermedades</h3><p>${animal.enfermedades || "Ninguna reportada"}</p></div>
                    <div class="detalle-botones">
                        <button onclick="window.location.href='perros.html'" class="btn-volver-detalle">← Volver</button>
                        ${animal.estado === "Disponible" ? `<button onclick="solicitarAdopcion(${animal.id}, '${animal.nombre}')" class="btn-adoptar-detalle">🐾 Solicitar Adopción</button>` : '<button class="btn-adoptado-detalle" disabled>❤️ Ya fue adoptado</button>'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="error-detalle"><p>❌ No se pudo cargar la información</p><button onclick="window.location.href='perros.html'">← Volver</button></div>`;
    }
}

function solicitarAdopcion(id, nombre) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("⚠️ Debes iniciar sesión");
        window.location.href = "login.html";
        return;
    }
    localStorage.setItem("adopcion_animal_id", id);
    localStorage.setItem("adopcion_animal_nombre", nombre);
    window.location.href = "solicitud.html";
}

document.addEventListener("DOMContentLoaded", () => {
    cargarDetalle();
});