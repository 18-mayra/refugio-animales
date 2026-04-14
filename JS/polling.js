let ultimoConteo = 0;
let pollingInterval = null;

async function iniciarPolling() {
  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch("http://localhost:3000/animales");
      const animales = await res.json();

      if (animales.length > ultimoConteo) {
        notificarNuevoAnimal();
        renderizarAnimales(animales);
        ultimoConteo = animales.length;
      }
    } catch (error) {
      console.error("Error en polling:", error);
    }
  }, 5000); // cada 5 segundos
}

function notificarNuevoAnimal() {
  const aviso = document.createElement("div");
  aviso.className = "notificacion";
  aviso.textContent = "🐾 ¡Nuevo animal disponible para adopción!";
  document.body.appendChild(aviso);

  setTimeout(() => aviso.remove(), 4000);
}