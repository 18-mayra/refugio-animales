// 📸 GALERÍA MULTIMEDIA - Videos e Imágenes

const API_URL = "http://localhost:3000";

// Imágenes destacadas (pueden venir de la BD)
const imagenesDestacadas = [
    { url: "img/perro.png", titulo: "Max - Buscando hogar", descripcion: "Labrador de 2 años" },
    { url: "img/perro2.png", titulo: "Luna - Energía pura", descripcion: "Husky de 1 año" },
    { url: "img/gato.png", titulo: "Simba - Cariñoso", descripcion: "Gato naranja de 3 años" },
    { url: "img/gato2.png", titulo: "Misi - Tranquila", descripcion: "Gatita de 2 años" },
    { url: "img/perro.png", titulo: "Rocky - Guardián", descripcion: "Pastor Alemán" },
    { url: "img/gato.png", titulo: "Tom - Aventurero", descripcion: "Gato gris" }
];

function renderizarImagenes() {
    const grid = document.getElementById("imagenesGrid");
    if (!grid) return;
    
    grid.innerHTML = imagenesDestacadas.map(img => `
        <div class="imagen-item" onclick="abrirModal('${API_URL}${img.url}', '${img.titulo}', '${img.descripcion}')">
            <img src="${API_URL}${img.url}" alt="${img.titulo}">
            <div class="imagen-overlay">
                <h3>${img.titulo}</h3>
                <p>${img.descripcion}</p>
            </div>
        </div>
    `).join('');
}

function abrirModal(imagenUrl, titulo, descripcion) {
    const modal = document.getElementById("modalImagen");
    const modalImg = document.getElementById("modalImg");
    const modalCaption = document.getElementById("modalCaption");
    
    if (!modal || !modalImg) return;
    
    modal.style.display = "block";
    modalImg.src = imagenUrl;
    modalCaption.innerHTML = `<strong>${titulo}</strong><br>${descripcion}`;
}

function cerrarModal() {
    const modal = document.getElementById("modalImagen");
    if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    renderizarImagenes();
    
    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        const modal = document.getElementById("modalImagen");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
});

window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;