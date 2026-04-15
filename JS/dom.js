const DOM = {
  mostrarUsuarios(usuarios) {
    const contenedor = document.getElementById("usuarios");
    if (!contenedor) {
      console.warn("Elemento 'usuarios' no encontrado");
      return;
    }
    
    contenedor.innerHTML = "";

    usuarios.forEach(u => {
      contenedor.innerHTML += `
        <div class="card fade">
          <h3>${u.name || u.nombre || 'Sin nombre'}</h3>
          <p>${u.email || 'Sin email'}</p>
        </div>
      `;
    });
  },

  mostrarPublicaciones(posts) {
    const contenedor = document.getElementById("publicaciones");
    if (!contenedor) {
      console.warn("Elemento 'publicaciones' no encontrado");
      return;
    }
    
    contenedor.innerHTML = "";

    posts.slice(0, 10).forEach(p => {
      contenedor.innerHTML += `
        <div class="card fade">
          <h4>${p.title || 'Sin título'}</h4>
          <p>${p.body || 'Sin contenido'}</p>
        </div>
      `;
    });
  },

  mostrarError(mensaje) {
    const error = document.getElementById("error");
    if (!error) {
      console.warn("Elemento 'error' no encontrado");
      alert(mensaje);
      return;
    }
    
    error.textContent = mensaje;
    error.classList.remove("oculto");

    setTimeout(() => {
      error.classList.add("oculto");
    }, 3000);
  }
};