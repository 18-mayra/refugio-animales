/* ===============================
   MENÚ
================================ */
const toggleBtn = document.querySelector(".menu-toggle");
const menuLinks = document.querySelector(".menu-links");
const submenuBtn = document.querySelector(".submenu-btn");
const submenuLinks = document.querySelector(".submenu-links");

if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        menuLinks.classList.toggle("active");
    });
}

if (submenuBtn) {
    submenuBtn.addEventListener("click", () => {
        submenuLinks.style.display =
            submenuLinks.style.display === "block" ? "none" : "block";
    });
}

/* ===============================
   VARIABLES
================================ */
const resultados = document.getElementById("resultados");
let cacheAnimales = [];
const API_BASE_URL = window.location.origin; // ✅ Dinámico

/* ===============================
   LOADER
================================ */
function mostrarLoader(mostrar = true) {
    const loader = document.getElementById("loader");
    if (!loader) return;
    loader.style.display = mostrar ? "flex" : "none";
}

function ocultarLoader() {
    const loader = document.getElementById("loader");
    if (!loader) return;
    loader.style.display = "none";
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

/* ===============================
   CARGAR ANIMALES
================================ */
async function cargarAnimales() {
    mostrarLoader(true);

    try {
        const res = await fetch(`${API_BASE_URL}/animales`);
        if (!res.ok) throw new Error("Error al cargar animales");

        cacheAnimales = await res.json();
        renderizar(cacheAnimales);

    } catch (error) {
        console.error("Error:", error);
        if (resultados) {
            resultados.innerHTML = `<p style="color:red">❌ ${error.message}</p>`;
        }
    }

    ocultarLoader();
}

/* ===============================
   RENDERIZAR
================================ */
function renderizar(data) {
    if (!resultados) return;
    resultados.innerHTML = "";

    if (data.length === 0) {
        resultados.innerHTML = "<p>No hay resultados</p>";
        return;
    }

    data.forEach(animal => {
        const card = document.createElement("div");
        card.className = "card";

        // Determinar estado visual
        const estadoClass = animal.estado === "Disponible" ? "disponible" : "adoptado";
        const estadoTexto = animal.estado === "Disponible" ? "✅ Disponible" : "❌ Adoptado";

        card.innerHTML = `
            <h3>${animal.nombre} (${animal.tipo})</h3>
            <p><b>Raza:</b> ${animal.raza || 'No especificada'}</p>
            <p><b>Edad:</b> ${animal.edad || '?'} años</p>
            <p class="estado ${estadoClass}"><b>Estado:</b> ${estadoTexto}</p>
            <button onclick="verMas(${animal.id})" class="btn-ver-mas">Ver más</button>
        `;

        resultados.appendChild(card);
    });
}

/* ===============================
   VER MÁS (CORREGIDO)
================================ */
function verMas(id) {
    // ✅ CORREGIDO: usar 'accessToken'
    const token = localStorage.getItem("accessToken");

    // Guardar animal pendiente
    localStorage.setItem("adopcion_animal_id", id);
    
    // Obtener nombre del animal para mostrar
    const animal = cacheAnimales.find(a => a.id === id);
    if (animal) {
        localStorage.setItem("adopcion_animal_nombre", animal.nombre);
    }

    // Si no hay sesión → login
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Verificar si el token es válido
    fetch(`${API_BASE_URL}/api/usuarios/token/validar`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Token inválido");
        // Token válido → ir a detalle
        window.location.href = `detalle.html?id=${id}`;
    })
    .catch(() => {
        // Token inválido → ir a login
        window.location.href = "login.html";
    });
}

/* ===============================
   AUTO ACTUALIZACIÓN (OPCIONAL)
================================ */
// En lugar de recargar cada 20 segundos, solo si la página está visible
let intervaloActualizacion = null;

function iniciarActualizacionAutomatica() {
    if (intervaloActualizacion) clearInterval(intervaloActualizacion);
    
    intervaloActualizacion = setInterval(() => {
        // Solo actualizar si la página está visible
        if (!document.hidden) {
            cargarAnimales();
        }
    }, 30000); // cada 30 segundos
}

function detenerActualizacionAutomatica() {
    if (intervaloActualizacion) {
        clearInterval(intervaloActualizacion);
        intervaloActualizacion = null;
    }
}

// Iniciar cuando la página carga
document.addEventListener("DOMContentLoaded", () => {
    cargarAnimales();
    iniciarActualizacionAutomatica();
});

// Detener cuando la página se cierra o cambia
window.addEventListener("beforeunload", () => {
    detenerActualizacionAutomatica();
});