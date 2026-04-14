const UI = {
  mostrarAnimales(animales, esAdmin) {
    const contenedor = document.getElementById("lista-animales");
    contenedor.innerHTML = "";

    animales.forEach((animal, index) => {
      const card = document.createElement("div");
      card.className = "animal-card";

      card.innerHTML = `
        <h3>${animal.nombre}</h3>
        <p><strong>Tipo:</strong> ${animal.tipo}</p>
        <p><strong>Edad:</strong> ${animal.edad}</p>
        <p>${animal.descripcion}</p>
        ${esAdmin ? `<button onclick="alert('Editar ${index}')">Editar</button>` : ""}
      `;

      contenedor.appendChild(card);
    });
  },

  limpiarFormulario() {
    document.getElementById("form-animal").reset();
  }
};