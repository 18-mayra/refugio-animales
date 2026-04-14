const DOM = {
  mostrarUsuarios(usuarios) {
    const contenedor = document.getElementById("usuarios");
    contenedor.innerHTML = "";

    usuarios.forEach(u => {
      contenedor.innerHTML += `
        <div class="card fade">
          <h3>${u.name}</h3>
          <p>${u.email}</p>
        </div>
      `;
    });
  },

  mostrarPublicaciones(posts) {
    const contenedor = document.getElementById("publicaciones");
    contenedor.innerHTML = "";

    posts.slice(0, 10).forEach(p => {
      contenedor.innerHTML += `
        <div class="card fade">
          <h4>${p.title}</h4>
          <p>${p.body}</p>
        </div>
      `;
    });
  }
};

DOM.mostrarError = function (mensaje) {
  const error = document.getElementById("error");
  error.textContent = mensaje;
  error.classList.remove("oculto");

  setTimeout(() => {
    error.classList.add("oculto");
  }, 3000);
};