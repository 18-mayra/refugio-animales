// app.js
document.addEventListener("DOMContentLoaded", () => {
  iniciarApp();
});

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
    alert("Error al cargar animales");
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

  // BUSCADOR
  if (buscador) {
    buscador.addEventListener(
      "keyup",
      debounce(async (e) => {
        const texto = e.target.value;

        mostrarLoader(true);
        const data = await buscarAnimales(texto);
        renderizarAnimales(data);
        mostrarLoader(false);
      }, 400)
    );
  }

  // FILTRO
  if (btnFiltrar) {
    btnFiltrar.addEventListener("click", async () => {

      const tipoSelect = document.getElementById("tipo");
      const estadoSelect = document.getElementById("estado");
      const edadSelect = document.getElementById("edad");

      const tipo = tipoSelect ? tipoSelect.value : "";
      const estado = estadoSelect ? estadoSelect.value : "";
      const edad = edadSelect ? edadSelect.value : "";

      mostrarLoader(true);
      const data = await filtrarAnimales(tipo, estado, edad);
      renderizarAnimales(data);
      mostrarLoader(false);

    });
  }
}

/* ===============================
   PETICIONES API
================================ */

async function obtenerAnimales() {
  const res = await fetch("http://localhost:3000/animales");
  return await res.json();
}

async function buscarAnimales(texto) {
  if (!texto) return obtenerAnimales();

  const res = await fetch(
    `http://localhost:3000/busqueda?texto=${texto}`
  );

  return await res.json();
}

async function filtrarAnimales(tipo, estado, edad) {

  const res = await fetch(
    `http://localhost:3000/filtro?tipo=${tipo}&estado=${estado}&edad=${edad}`
  );

  return await res.json();
}

/* ===============================
   RENDER
================================ */

function renderizarAnimales(animales) {

  const contenedor = document.getElementById("resultados");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!animales || animales.length === 0) {
    contenedor.innerHTML = "<p>No hay resultados</p>";
    return;
  }

  animales.forEach((animal) => {

    const card = document.createElement("div");
    card.className = "card fade";

    card.innerHTML = `
      <h3>${animal.nombre} (${animal.tipo})</h3>
      <p><b>Raza:</b> ${animal.raza}</p>
      <p><b>Edad:</b> ${animal.edad}</p>
      <p><b>Estado:</b> ${animal.estado}</p>

      <button class="btn-ver-mas">
        Ver más
      </button>
    `;

    card.querySelector(".btn-ver-mas").addEventListener("click", () => {
      verMas(animal.id);
    });

    contenedor.appendChild(card);
  });
}

/* ===============================
   VER MÁS
================================ */
function verMas(id) {

  const usuario = localStorage.getItem("usuario");

  if (!usuario) {
    alert("Debes iniciar sesión");

    // 🔥 SOLO aquí se guarda
    localStorage.setItem("animalPendiente", id);

    window.location.href = "login.html";
    return;
  }

  window.location.href = `detalle.html?id=${id}`;
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