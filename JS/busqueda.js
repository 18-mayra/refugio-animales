// búsqueda.js - Búsqueda de animales

const API_BASE_URL = window.location.origin;
let timeoutBusqueda = null;

function buscarSimple() {
    const texto = document.getElementById("busquedaSimple").value.trim();
    const contenedor = document.getElementById("resultados");
    
    if (!contenedor) return;
    
    // Si no hay texto, limpiar resultados
    if (texto === "") {
        contenedor.innerHTML = "";
        return;
    }
    
    // Mostrar loader
    contenedor.innerHTML = '<div class="loader">🔍 Buscando...</div>';
    
    // Limpiar timeout anterior
    if (timeoutBusqueda) {
        clearTimeout(timeoutBusqueda);
    }
    
    // Esperar 300ms antes de buscar (debounce)
    timeoutBusqueda = setTimeout(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/busqueda?texto=${encodeURIComponent(texto)}`);
            
            if (!res.ok) throw new Error("Error en la búsqueda");
            
            const data = await res.json();
            
            if (data.length === 0) {
                contenedor.innerHTML = `
                    <div class="no-resultados">
                        <p>❌ No se encontraron resultados para "${escaparHTML(texto)}"</p>
                    </div>
                `;
                return;
            }
            
            contenedor.innerHTML = `
                <h3>📋 Resultados encontrados (${data.length})</h3>
                <div class="animales-grid">
                    ${data.map(animal => `
                        <div class="animal-card">
                            <div class="animal-img">
                                <img src="${getImagenUrl(animal.imagen_url)}" alt="${escaparHTML(animal.nombre)}" onerror="this.src='/img/perro.png'">
                            </div>
                            <div class="animal-info">
                                <h3>${escaparHTML(animal.nombre)} (${animal.tipo})</h3>
                                <p><b>🐾 Raza:</b> ${escaparHTML(animal.raza || 'No especificada')}</p>
                                <p><b>📅 Edad:</b> ${animal.edad || '?'} años</p>
                                <p><b>📌 Estado:</b> ${animal.estado === 'Disponible' ? '✅ Disponible' : '❤️ Adoptado'}</p>
                                <div class="card-buttons">
                                    <button class="btn-ver-mas" onclick="verDetalle(${animal.id})">🔍 Ver más</button>
                                    <button class="btn-adoptar" onclick="solicitarAdopcion(${animal.id}, '${escaparHTML(animal.nombre)}')">🐾 Adoptar</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error("Error en búsqueda:", error);
            contenedor.innerHTML = `<div class="error-message">❌ Error al buscar: ${error.message}</div>`;
        }
    }, 300);
}

// Función auxiliar para escapar HTML
function escaparHTML(texto) {
    if (!texto) return "";
    return texto.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Función para obtener URL de imagen
function getImagenUrl(imagenUrl) {
    if (!imagenUrl || imagenUrl === '/img/default.png') {
        return '/img/perro.png';
    }
    if (imagenUrl.startsWith('/uploads/')) return imagenUrl;
    if (imagenUrl.startsWith('img/')) return imagenUrl;
    if (imagenUrl.startsWith('http')) return imagenUrl;
    return '/img/perro.png';
}

// Funciones globales para los botones
function verDetalle(id) {
    window.location.href = `detalle.html?id=${id}`;
}

function solicitarAdopcion(id, nombre) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("⚠️ Debes iniciar sesión para solicitar una adopción");
        window.location.href = "login.html";
        return;
    }
    localStorage.setItem("adopcion_animal_id", id);
    localStorage.setItem("adopcion_animal_nombre", nombre);
    window.location.href = "solicitud.html";
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("busquedaSimple");
    if (buscador) {
        buscador.addEventListener("input", buscarSimple);
    }
});