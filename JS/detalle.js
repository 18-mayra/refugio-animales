console.log("detalle.js cargado");

// 🔐 VALIDAR SESIÓN CON TOKEN
const token = localStorage.getItem("token");

if (!token) {
  alert("Debes iniciar sesión para ver el detalle");

  const params = new URLSearchParams(window.location.search);
  const idPendiente = params.get("id");

  if (idPendiente) {
    localStorage.setItem("animalPendiente", idPendiente);
  }

  window.location.href = "login.html";
}

// 📌 OBTENER ID DESDE LA URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const contenedor = document.getElementById("detalle");

if (!id) {
  contenedor.innerHTML = "<p style='color:red'>ID no válido</p>";
  throw new Error("No hay ID en la URL");
}

function getImagenUrl(imagenUrl) {
    if (!imagenUrl) return "https://via.placeholder.com/500x400?text=Sin+Imagen";
    if (imagenUrl.startsWith('http')) return imagenUrl;
    if (imagenUrl.startsWith('/uploads/')) return `http://localhost:3000${imagenUrl}`;
    if (imagenUrl.startsWith('img/')) return `http://localhost:5500/${imagenUrl}`;
    return "https://via.placeholder.com/500x400?text=Sin+Imagen";
}

function getEstadoBadge(estado) {
    const estadoLower = (estado || "").toLowerCase();
    if (estadoLower === "disponible") return '<span class="badge-disponible">✅ Disponible para adopción</span>';
    if (estadoLower === "adoptado") return '<span class="badge-adoptado">❤️ Ya fue adoptado</span>';
    return `<span class="badge">${estado}</span>`;
}

fetch(`http://localhost:3000/animales/${id}`, {
  headers: { "Authorization": "Bearer " + token }
})
.then(res => {
    if (!res.ok) throw new Error("Animal no encontrado");
    return res.json();
})
.then(animal => {
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
          <div class="detalle-seccion"><h3>😊 Comportamiento</h3><p>${animal.comportamiento || "Información no disponible"}</p></div>
          <div class="detalle-botones">
            <button onclick="volver()" class="btn-volver-detalle">← Volver</button>
            ${animal.estado === "Disponible" ? `<button onclick="adoptar(${animal.id}, '${animal.nombre}')" class="btn-adoptar-detalle">🐾 Solicitar Adopción</button>` : '<button class="btn-adoptado-detalle" disabled>❤️ Ya fue adoptado</button>'}
          </div>
        </div>
      </div>
    `;
})
.catch(error => {
    console.error(error);
    contenedor.innerHTML = `<div class="error-detalle"><p>❌ No se pudo cargar la información</p><button onclick="volver()">← Volver</button></div>`;
});

function volver() { window.location.href = "perros.html"; }

function adoptar(id, nombre) {
    localStorage.setItem("adopcion_animal_id", id);
    localStorage.setItem("adopcion_animal_nombre", nombre);
    window.location.href = "solicitud.html";
}