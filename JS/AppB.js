console.log("APP B cargado");

const token = localStorage.getItem("token");

if (!token) {
  alert("No hay sesión");
  window.location.href = "login.html";
}

fetch("http://localhost:3000/api/token/validar", {
  headers: {
    Authorization: "Bearer " + token
  }
})
.then(res => {
  if (!res.ok) throw new Error();
  return res.json();
})
.then(data => {
  console.log("SSO OK:", data);

  alert("Acceso correcto a App B");

  // 🔥 regresar automáticamente
  window.location.href = "index.html";
})
.catch(() => {
  alert("Sesión inválida");
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
});