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
        const res = await fetch("http://localhost:3000/animales");
        if (!res.ok) throw new Error("Error al cargar animales");

        cacheAnimales = await res.json();
        renderizar(cacheAnimales);

    } catch (error) {
        resultados.innerHTML = `<p style="color:red">${error.message}</p>`;
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

        card.innerHTML = `
            <h3>${animal.nombre} (${animal.tipo})</h3>
            <p><b>Raza:</b> ${animal.raza}</p>
            <p><b>Edad:</b> ${animal.edad}</p>
            <p><b>Estado:</b> ${animal.estado}</p>
            <button onclick="verMas(${animal.id})">Ver más</button>
        `;

        resultados.appendChild(card);
    });
}

/* ===============================
   VER MÁS (CORRECTO)
================================ */
function verMas(id) {

    const token = localStorage.getItem("token");

    // 🔐 Si NO hay sesión → login
    if (!token) {
        localStorage.setItem("animalPendiente", id);
        window.location.href = "login.html";
        return;
    }

    // ✅ Si YA hay sesión → ir directo
    window.location.href = `detalle.html?id=${id}`;
}

/* ===============================
   AUTO ACTUALIZACIÓN
================================ */
setInterval(cargarAnimales, 20000);

/* ===============================
   INICIO
================================ */
document.addEventListener("DOMContentLoaded", cargarAnimales);