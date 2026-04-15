// editar.js - Editar animal con imagen

const API_URL = "http://localhost:3000";

let csrfToken = "";
let imagenUrlActual = "";

// Obtener CSRF token
async function obtenerCSRF() {
    try {
        const res = await fetch(`${API_URL}/api/csrf-token`, {
            credentials: "include"
        });
        const data = await res.json();
        csrfToken = data.csrfToken;
        console.log("✅ CSRF Token obtenido");
    } catch (error) {
        console.error("Error CSRF:", error);
    }
}

// Subir imagen
async function subirImagen(file) {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('imagen', file);
    
    try {
        const token = localStorage.getItem("token");
        console.log("📡 Subiendo imagen...", file.name);
        
        const res = await fetch(`${API_URL}/api/admin/upload`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "CSRF-Token": csrfToken
            },
            body: formData
        });
        
        let data;
        const text = await res.text();
        
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Error parsing:", text);
            throw new Error("Respuesta inválida del servidor");
        }
        
        if (!res.ok) {
            throw new Error(data.error || "Error al subir imagen");
        }
        
        console.log("✅ Imagen subida:", data.url);
        return data.url;
        
    } catch (error) {
        console.error("❌ Error subiendo imagen:", error);
        alert("Error al subir la imagen: " + error.message);
        return null;
    }
}

// Obtener ID de la URL
const urlParams = new URLSearchParams(window.location.search);
const animalId = urlParams.get('id');

// Cargar datos del animal
async function cargarAnimal() {
    if (!animalId) {
        alert("No se especificó ningún animal");
        window.location.href = "admin.html";
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/animales/${animalId}`);
        
        if (!res.ok) {
            throw new Error("Error al cargar animal");
        }
        
        const animal = await res.json();
        
        // Guardar URL de imagen actual
        imagenUrlActual = animal.imagen_url || "";
        
        // Llenar formulario
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
        
        // Mostrar imagen actual
        const imgPreview = document.getElementById("imgPreview");
        if (imagenUrlActual && imagenUrlActual !== '/img/default.png') {
            let imgUrl = imagenUrlActual.startsWith('http') 
                ? imagenUrlActual 
                : `${API_URL}${imagenUrlActual}`;
            imgPreview.src = imgUrl;
        } else {
            // ✅ USAR PLACEHOLDER DE INTERNET
            imgPreview.src = "https://via.placeholder.com/200x200?text=Sin+Imagen";
        }
        
    } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar los datos del animal");
        window.location.href = "admin.html";
    }
}

// Guardar cambios
async function guardarCambios(event) {
    event.preventDefault();
    
    const token = localStorage.getItem("token");
    
    if (!token) {
        alert("Debes iniciar sesión");
        window.location.href = "login.html";
        return;
    }
    
    const imagenFile = document.getElementById("imagen")?.files[0];
    let nuevaImagenUrl = null;
    
    // Subir nueva imagen si hay
    if (imagenFile) {
        nuevaImagenUrl = await subirImagen(imagenFile);
        if (!nuevaImagenUrl) {
            alert("Error al subir la imagen. El animal no se guardó.");
            return;
        }
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
    
    // Si se subió nueva imagen, actualizar URL
    if (nuevaImagenUrl) {
        datos.imagen_url = nuevaImagenUrl;
    }
    
    const btn = document.querySelector("button[type='submit']");
    const originalText = btn.textContent;
    btn.textContent = "💾 Guardando...";
    btn.disabled = true;
    
    try {
        const res = await fetch(`${API_URL}/admin/animales/${animalId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
                "CSRF-Token": csrfToken
            },
            body: JSON.stringify(datos)
        });
        
        let data;
        try {
            data = await res.json();
        } catch (e) {
            throw new Error("Error del servidor");
        }
        
        if (!res.ok) {
            throw new Error(data.error || data.mensaje || "Error al guardar");
        }
        
        alert("✅ Animal actualizado correctamente");
        window.location.href = "admin.html";
        
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al guardar: " + error.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Vista previa de imagen al seleccionar
function setupImagePreview() {
    const imagenInput = document.getElementById("imagen");
    const imgPreview = document.getElementById("imgPreview");
    
    if (imagenInput) {
        imagenInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imgPreview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                // Restaurar imagen actual
                if (imagenUrlActual && imagenUrlActual !== '/img/default.png') {
                    let imgUrl = imagenUrlActual.startsWith('http') 
                        ? imagenUrlActual 
                        : `${API_URL}${imagenUrlActual}`;
                    imgPreview.src = imgUrl;
                } else {
                    imgPreview.src = "https://via.placeholder.com/200x200?text=Sin+Imagen";
                }
            }
        });
    }
}

// Configurar evento del formulario
const form = document.getElementById("formEditar");
if (form) {
    form.addEventListener("submit", guardarCambios);
}

// Inicializar
document.addEventListener("DOMContentLoaded", async () => {
    // Verificar autenticación
    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    
    if (!token) {
        alert("Debes iniciar sesión");
        window.location.href = "login.html";
        return;
    }
    
    if (usuario.rol !== "admin" && usuario.rol !== "superadmin") {
        alert("Acceso solo para administradores");
        window.location.href = "index.html";
        return;
    }
    
    await obtenerCSRF();
    setupImagePreview();
    cargarAnimal();
});