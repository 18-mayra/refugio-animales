// galeria.js - Galería de animales

const API_URL = "https://refugio-animales.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
    const galeriaGrid = document.querySelector(".galeria-grid");
    if (!galeriaGrid) return;

    try {
        const response = await fetch(API_URL + "/animales");
        const animales = await response.json();

        if (!animales || animales.length === 0) {
            galeriaGrid.innerHTML = "<p>No hay animales disponibles</p>";
            return;
        }

        galeriaGrid.innerHTML = animales.map(animal => {
            let imgUrl = animal.imagen_url || `/img/${animal.tipo === "Perro" ? "perro.png" : "gato.png"}`;
            if (imgUrl.startsWith('/uploads/')) imgUrl = API_URL + imgUrl;
            
            return `
                <div class="galeria-item">
                    <img src="${imgUrl}" alt="${animal.nombre}" onerror="this.src='/img/perro.png'">
                    <div class="galeria-info">
                        <h3>${animal.nombre}</h3>
                        <p>${animal.raza || "Raza desconocida"}</p>
                        <p>${animal.edad || "?"} años</p>
                        <span class="badge ${animal.estado === "Disponible" ? "disponible" : "adoptado"}">
                            ${animal.estado || "Disponible"}
                        </span>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Error cargando galería:", error);
        galeriaGrid.innerHTML = "<p>❌ Error al cargar la galería</p>";
    }
});