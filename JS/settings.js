async function cambiarPass() {

  const token = localStorage.getItem("token");
  const pass = document.getElementById("pass").value;

  await fetch("http://localhost:3000/api/settings/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ nueva: pass })
  });

  alert("Contraseña actualizada");
}