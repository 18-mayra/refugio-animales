document.addEventListener("DOMContentLoaded", cargarSesiones);

async function cargarSesiones() {

  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:3000/api/sessions", {
    headers: { Authorization: token }
  });

  const data = await res.json();

  const contenedor = document.getElementById("sesiones");

  contenedor.innerHTML = "";

  data.forEach(s => {
    contenedor.innerHTML += `
      <div>
        <p>${s.ip}</p>
        <button onclick="cerrarSesion(${s.id})">Cerrar</button>
      </div>
    `;
  });

}

async function cerrarSesion(id) {

  const token = localStorage.getItem("token");

  await fetch(`http://localhost:3000/api/sessions/${id}`, {
    method: "DELETE",
    headers: { Authorization: token }
  });

  cargarSesiones();
}