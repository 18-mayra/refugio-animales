// app.js - Página principal (versión corregida)

document.addEventListener("DOMContentLoaded", () => {
    iniciarApp();
});

const API_BASE_URL = window.location.origin;

/* ===============================
   INICIO GENERAL
================================ */
async function iniciarApp() {
    mostrarLoader(true);

    try {
        const animales = await obtenerAnimales();
        renderizarAnimales(animales);
    } catch (error) {
        console.error(error);
        const contenedor = document.getElementById("resultados");
        if (contenedor) {
            contenedor.innerHTML = `<p class="error-message">❌ Error al cargar animales: ${error.message}</p>`;
        }
    } finally {
        mostrarLoader(false);
    }

    activarEventos();
}

/* ===============================
   EVENTOS
================================ */
function activarEventos() {
    const buscador = document.getElementById("buscador");
    const btnFiltrar = document.getElementById("btnFiltrar");

    if (buscador) {
        buscador.addEventListener("keyup", debounce(async (e) => {
            const texto = e.target.value;
            mostrarLoader(true);
            try {
                const data = await buscarAnimales(texto);
                renderizarAnimales(data);
            } catch (error) {
                console.error(error);
            } finally {
                mostrarLoader(false);
            }
        }, 400));
    }

    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", async () => {
            const tipoSelect = document.getElementById("tipo");
            const estadoSelect = document.getElementById("estado");
            const edadSelect = document.getElementById("edad");

            const tipo = tipoSelect ? tipoSelect.value : "";
            const estado = estadoSelect ? estadoSelect.value : "";
            const edad = edadSelect ? edadSelect.value : "";

            mostrarLoader(true);
            try {
                const data = await filtrarAnimales(tipo, estado, edad);
                renderizarAnimales(data);
            } catch (error) {
                console.error(error);
            } finally {
                mostrarLoader(false);
            }
        });
    }
}

/* ===============================
   PETICIONES API
================================ */
async function obtenerAnimales() {
    const res = await fetch(`${API_BASE_URL}/animales`);
    if (!res.ok) throw new Error("Error al obtener animales");
    return await res.json();
}

async function buscarAnimales(texto) {
    if (!texto) return obtenerAnimales();
    const res = await fetch(`${API_BASE_URL}/busqueda?texto=${encodeURIComponent(texto)}`);
    if (!res.ok) throw new Error("Error en búsqueda");
    return await res.json();
}

async function filtrarAnimales(tipo, estado, edad) {
    const params = new URLSearchParams();
    if (tipo) params.append("tipo", tipo);
    if (estado) params.append("estado", estado);
    if (edad) params.append("edad", edad);
    
    const res = await fetch(`${API_BASE_URL}/filtro?${params.toString()}`);
    if (!res.ok) throw new Error("Error al filtrar");
    return await res.json();
}

/* ===============================
   RENDER
================================ */
function escaparHTML(texto) {
    if (!texto) return "";
    return texto.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getEstadoBadge(estado) {
    const estadoLower = (estado || "").toLowerCase();
    if (estadoLower === "disponible") return '<span class="badge disponible">✅ Disponible</span>';
    if (estadoLower === "adoptado") return '<span class="badge adoptado">❤️ Adoptado</span>';
    return `<span class="badge">${escaparHTML(estado)}</span>`;
}

function renderizarAnimales(animales) {
    const contenedor = document.getElementById("resultados");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!animales || animales.length === 0) {
        contenedor.innerHTML = '<p class="no-resultados">No hay animales disponibles</p>';
        return;
    }

    animales.forEach((animal) => {
        const card = document.createElement("div");
        card.className = "animal-card fade";

        card.innerHTML = `
            <div class="animal-img">
                <img src="${animal.imagen_url || '/img/perro.png'}" alt="${escaparHTML(animal.nombre)}" onerror="this.src='/img/perro.png'">
            </div>
            <div class="animal-info">
                <h3>${escaparHTML(animal.nombre)} (${animal.tipo})</h3>
                <p><b>🐾 Raza:</b> ${escaparHTML(animal.raza || 'No especificada')}</p>
                <p><b>📅 Edad:</b> ${animal.edad || '?'} años</p>
                ${getEstadoBadge(animal.estado)}
                <div class="card-buttons">
                    <button class="btn-ver-mas" data-id="${animal.id}">🔍 Ver más</button>
                    <button class="btn-adoptar" data-id="${animal.id}" data-nombre="${escaparHTML(animal.nombre)}">🐾 Adoptar</button>
                </div>
            </div>
        `;

        // Eventos
        card.querySelector(".btn-ver-mas").addEventListener("click", () => {
            verMas(animal.id);
        });

        card.querySelector(".btn-adoptar").addEventListener("click", () => {
            solicitarAdopcion(animal.id, animal.nombre);
        });

        contenedor.appendChild(card);
    });
}

/* ===============================
   VER MÁS
================================ */
function verMas(id) {
    window.location.href = `detalle.html?id=${id}`;
}

/* ===============================
   SOLICITAR ADOPCIÓN
================================ */
function solicitarAdopcion(id, nombre) {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
        alert("⚠️ Debes iniciar sesión para solicitar una adopción");
        localStorage.setItem("adopcion_animal_id", id);
        localStorage.setItem("adopcion_animal_nombre", nombre);
        window.location.href = "login.html";
        return;
    }
    
    localStorage.setItem("adopcion_animal_id", id);
    localStorage.setItem("adopcion_animal_nombre", nombre);
    window.location.href = "solicitud.html";
}

/* ===============================
   LOADER
================================ */
function mostrarLoader(mostrar) {
    const loader = document.getElementById("loader");
    if (!loader) return;
    loader.style.display = mostrar ? "flex" : "none";
}

/* ===============================
   DEBOUNCE
================================ */
function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}