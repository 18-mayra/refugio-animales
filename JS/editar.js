// editar.js - Editar animal con imagen (CORREGIDO PARA RENDER)

const API_BASE_URL = window.location.origin;  // ✅ Usar URL dinámica (funciona en local y producción)

let csrfToken = "";
let imagenUrlActual = "";

// ===============================
// 🔐 OBTENER CSRF
// ===============================
async function obtenerCSRF() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
            credentials: "include"
        });
        const data = await res.json();
        csrfToken = data.csrfToken;
        console.log("✅ CSRF Token obtenido");
    } catch (error) {
        console.error("Error CSRF:", error);
    }
}

// ===============================
// 🖼️ SUBIR IMAGEN
// ===============================
async function subirImagen(file) {
    if (!file) return null;

    const formData = new FormData();
    formData.append('imagen', file);

    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("No hay sesión activa");
            return null;
        }

        const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "CSRF-Token": csrfToken
            },
            body: formData
        });

        if (res.status === 401 || res.status === 403) {
            alert("Sesión expirada. Inicia sesión nuevamente.");
            window.location.href = "/login.html";
            return null;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir imagen");
        return data.url;

    } catch (error) {
        console.error("❌ Error subiendo imagen:", error);
        alert("Error al subir la imagen: " + error.message);
        return null;
    }
}

// ===============================
// 📌 OBTENER ID
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const animalId = urlParams.get('id');

// ===============================
// 📥 CARGAR ANIMAL
// ===============================
async function cargarAnimal() {
    if (!animalId) {
        alert("No se especificó ningún animal");
        window.location.href = "admin.html";
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/animales/${animalId}`);
        if (!res.ok) throw new Error("Animal no encontrado");
        
        const animal = await res.json();

        imagenUrlActual = animal.imagen_url || "";

        document.getElementById("idAnimal").value = animal.id;
        document.getElementById("tipo").value = animal.tipo;
        document.getElementById("nombre").value = animal.nombre;
        document.getElementById("edad").value = animal.edad;
        document.getElementById("raza").value = animal.raza || "";
        document.getElementById("comportamiento").value = animal.comportamiento || "";
        document.getElementById("vacunas").value = animal.vacunas || "";
        document.getElementById("enfermedades").value = animal.enfermedades || "";
        document.getElementById("descripcion").value = animal.descripcion || "";
        document.getElementById("estado").value = animal.estado || "Disponible";

        const imgPreview = document.getElementById("imgPreview");
        if (imgPreview) {
            if (imagenUrlActual) {
                imgPreview.src = imagenUrlActual.startsWith("http")
                    ? imagenUrlActual
                    : `${API_BASE_URL}${imagenUrlActual}`;
            } else {
                imgPreview.src = `${API_BASE_URL}/img/perro.png`;
            }
        }

        console.log("✅ Animal cargado:", animal.nombre);

    } catch (error) {
        console.error(error);
        alert("Error al cargar el animal");
    }
}

// ===============================
// 💾 GUARDAR CAMBIOS
// ===============================
async function guardarCambios(e) {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("Debes iniciar sesión");
        window.location.href = "login.html";
        return;
    }

    const imagenFile = document.getElementById("imagen").files[0];
    let nuevaImagenUrl = null;

    if (imagenFile) {
        nuevaImagenUrl = await subirImagen(imagenFile);
        if (!nuevaImagenUrl) return;
    }

    const datos = {
        tipo: document.getElementById("tipo").value,
        nombre: document.getElementById("nombre").value,
        edad: parseInt(document.getElementById("edad").value) || null,
        raza: document.getElementById("raza").value || null,
        comportamiento: document.getElementById("comportamiento").value || null,
        vacunas: document.getElementById("vacunas").value || null,
        enfermedades: document.getElementById("enfermedades").value || null,
        descripcion: document.getElementById("descripcion").value || null,
        estado: document.getElementById("estado").value
    };

    if (nuevaImagenUrl) {
        datos.imagen_url = nuevaImagenUrl;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/admin/animales/${animalId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
                "CSRF-Token": csrfToken
            },
            body: JSON.stringify(datos)
        });

        if (res.status === 401 || res.status === 403) {
            alert("Sesión expirada. Inicia sesión nuevamente.");
            window.location.href = "/login.html";
            return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar");

        alert("✅ Actualizado correctamente");
        window.location.href = "admin.html";

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

// ===============================
// 🖼️ PREVIEW
// ===============================
function setupImagePreview() {
    const input = document.getElementById("imagen");
    const preview = document.getElementById("imgPreview");

    if (input && preview) {
        input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = e => preview.src = e.target.result;
            reader.readAsDataURL(file);
        });
    }
}

// ===============================
// 🚀 INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("accessToken");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    if (!token) {
        alert("Debes iniciar sesión");
        window.location.href = "login.html";
        return;
    }

    if (usuario.rol !== "admin" && usuario.rol !== "superadmin") {
        alert("Acceso solo admin");
        window.location.href = "index.html";
        return;
    }

    await obtenerCSRF();
    setupImagePreview();
    await cargarAnimal();
});

const form = document.getElementById("formEditar");
if (form) form.addEventListener("submit", guardarCambios);