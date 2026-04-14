function soloAdmin() {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
    return;
  }

  fetch("http://localhost:3000/api/usuarios/token/validar", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Token inválido");
    return res.json();
  })
  .then(data => {

    console.log("🔐 GUARD VALIDADO:", data);

    if (!data.usuario) {
      throw new Error("Sin usuario");
    }

    const rol = String(data.usuario.rol || "")
      .toLowerCase()
      .trim();

    console.log("👑 ROL GUARD:", rol);

    if (rol !== "admin") {
      alert("Acceso solo para administradores");
      window.location.href = "index.html";
    }

  })
  .catch(() => {
    localStorage.clear();
    window.location.href = "login.html";
  });

}