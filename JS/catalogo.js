(function() {
    const TIPO_ANIMAL = window.location.pathname.includes("perros") ? "Perro" : "Gato";
    const buscador = document.getElementById("buscador");
    const edadSelect = document.getElementById("edad");
    const estadoSelect = document.getElementById("estado");
    const btnFiltrar = document.getElementById("btnFiltrar");
    const resultadosDiv = document.getElementById("resultados");
    const loader = document.getElementById("loader");

    let animalesGlobal = [];
    let timeoutBusqueda = null;

    const API_URL = "https://refugio-animales.onrender.com";

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

    function getImagenUrl(imagenUrl) {
        if (!imagenUrl || imagenUrl === '/img/default.png') {
            return `/img/${TIPO_ANIMAL === "Perro" ? "perro.png" : "gato.png"}`;
        }
        if (imagenUrl.startsWith('/uploads/')) return imagenUrl;
        if (imagenUrl.startsWith('img/')) return imagenUrl;
        if (imagenUrl.startsWith('http')) return imagenUrl;
        return `/img/perro.png`;
    }

    function mostrarLoader(mostrar) { if (loader) loader.classList.toggle("hidden", !mostrar); }

    function filtrarAnimales() {
        let filtrados = animalesGlobal.filter(a => a.tipo === TIPO_ANIMAL);
        const estado = estadoSelect?.value;
        if (estado && estado !== "") filtrados = filtrados.filter(a => a.estado === estado);
        const edad = edadSelect?.value;
        if (edad && edad !== "") { const [min, max] = edad.split("-"); filtrados = filtrados.filter(a => parseInt(a.edad) >= parseInt(min) && parseInt(a.edad) <= parseInt(max)); }
        const texto = buscador?.value.trim().toLowerCase();
        if (texto) filtrados = filtrados.filter(a => a.nombre.toLowerCase().includes(texto) || (a.raza && a.raza.toLowerCase().includes(texto)));
        renderizarAnimales(filtrados);
    }

    function renderizarAnimales(animales) {
        if (!resultadosDiv) return;
        if (!animales || animales.length === 0) {
            resultadosDiv.innerHTML = `<div class="no-resultados"><p>No hay ${TIPO_ANIMAL === "Perro" ? "perros" : "gatos"} disponibles</p></div>`;
            return;
        }
        resultadosDiv.innerHTML = `<div class="animales-grid">${animales.map(animal => `
            <div class="animal-card">
                <div class="animal-img">
                    <img src="${getImagenUrl(animal.imagen_url)}" alt="${escaparHTML(animal.nombre)}" onerror="this.src='/img/${TIPO_ANIMAL === "Perro" ? "perro.png" : "gato.png"}'">
                </div>
                <div class="animal-info">
                    <h3>${escaparHTML(animal.nombre)}</h3>
                    <p class="raza">🐾 ${escaparHTML(animal.raza || 'Raza desconocida')}</p>
                    <p class="edad">📅 ${animal.edad || '?'} años</p>
                    <p class="descripcion">${escaparHTML(animal.descripcion ? animal.descripcion.substring(0, 80) + '...' : 'Sin descripción')}</p>
                    ${getEstadoBadge(animal.estado)}
                    <div class="card-buttons">
                        <button class="btn-ver-mas" onclick="window.verDetalle(${animal.id})">🐾 Ver más</button>
                        <button class="btn-adoptar" onclick="window.solicitarAdopcion(${animal.id}, '${escaparHTML(animal.nombre)}')">🐾 Solicitar Adopción</button>
                    </div>
                </div>
            </div>
        `).join('')}</div>`;
    }

    async function cargarAnimales() {
        mostrarLoader(true);
        try { animalesGlobal = await API.obtenerAnimales(); filtrarAnimales(); } catch (error) { console.error(error); if (resultadosDiv) resultadosDiv.innerHTML = `<p class="error">❌ Error al cargar</p>`; } finally { mostrarLoader(false); }
    }

    window.solicitarAdopcion = function(animalId, animalNombre) {
        const token = localStorage.getItem("token");
        if (!token) { alert("⚠️ Debes iniciar sesión"); window.location.href = "login.html"; return; }
        localStorage.setItem("adopcion_animal_id", animalId);
        localStorage.setItem("adopcion_animal_nombre", animalNombre);
        window.location.href = "solicitud.html";
    };

    window.verDetalle = function(id) {
        window.location.href = `detalle.html?id=${id}`;
    };

    function setupEventos() {
        if (buscador) buscador.addEventListener("input", () => { clearTimeout(timeoutBusqueda); timeoutBusqueda = setTimeout(() => filtrarAnimales(), 300); });
        if (edadSelect) edadSelect.addEventListener("change", () => filtrarAnimales());
        if (estadoSelect) estadoSelect.addEventListener("change", () => filtrarAnimales());
        if (btnFiltrar) btnFiltrar.addEventListener("click", () => filtrarAnimales());
    }

    document.addEventListener("DOMContentLoaded", () => { if (typeof API !== 'undefined') { setupEventos(); cargarAnimales(); } else console.error("API no cargada"); });
})();