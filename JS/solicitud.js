// solicitud.js - Formulario de solicitud de adopción

const API_URL = "http://localhost:3000";

// Obtener datos del animal desde localStorage
const animalId = localStorage.getItem("adopcion_animal_id");
const animalNombre = localStorage.getItem("adopcion_animal_nombre");

// Mostrar información del animal seleccionado
async function cargarInfoAnimal() {
    const detalleDiv = document.getElementById("detalleAnimal");
    
    if (!detalleDiv) return;
    
    if (!animalId) {
        detalleDiv.innerHTML = `
            <div class="alert-warning">
                ⚠️ No se ha seleccionado ningún animal para adoptar.
                <br><a href="perros.html">Ver animales disponibles</a>
            </div>
        `;
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/animales/${animalId}`);
        
        if (!res.ok) throw new Error("Animal no encontrado");
        
        const animal = await res.json();
        
        // Obtener URL de la imagen
        let imgUrl = "https://via.placeholder.com/150x150?text=Sin+Imagen";
        if (animal.imagen_url) {
            if (animal.imagen_url.startsWith('http')) {
                imgUrl = animal.imagen_url;
            } else if (animal.imagen_url.startsWith('/uploads/')) {
                imgUrl = `http://localhost:3000${animal.imagen_url}`;
            } else if (animal.imagen_url.startsWith('img/')) {
                imgUrl = `http://localhost:5500/${animal.imagen_url}`;
            }
        }
        
        detalleDiv.innerHTML = `
            <div class="animal-solicitud">
                <img src="${imgUrl}" alt="${animal.nombre}" onerror="this.src='https://via.placeholder.com/150x150?text=Sin+Imagen'">
                <div class="animal-solicitud-info">
                    <h3>${animal.nombre}</h3>
                    <p><strong>Tipo:</strong> ${animal.tipo}</p>
                    <p><strong>Raza:</strong> ${animal.raza || 'No especificada'}</p>
                    <p><strong>Edad:</strong> ${animal.edad || '?'} años</p>
                    <p><strong>Estado:</strong> ${animal.estado || 'Disponible'}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error cargando animal:", error);
        detalleDiv.innerHTML = `<div class="alert-error">❌ Error al cargar la información del animal</div>`;
    }
}

// Enviar solicitud de adopción
const form = document.getElementById("formSolicitud");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem("token");
        
        if (!token) {
            alert("⚠️ Debes iniciar sesión para solicitar una adopción");
            window.location.href = "login.html";
            return;
        }
        
        const nombre = document.getElementById("nombre")?.value || "";
        const email = document.getElementById("email")?.value || "";
        const telefono = document.getElementById("telefono")?.value || "";
        const mensaje = document.getElementById("mensaje")?.value || "";
        
        if (!nombre || !email || !telefono) {
            alert("❌ Por favor completa todos los campos obligatorios");
            return;
        }
        
        const datos = {
            animal_id: parseInt(animalId),
            nombre: nombre,
            email: email,
            telefono: telefono,
            mensaje: mensaje
        };
        
        const btn = form.querySelector("button[type='submit']");
        const originalText = btn.textContent;
        btn.textContent = "📨 Enviando solicitud...";
        btn.disabled = true;
        
        try {
            const res = await fetch(`${API_URL}/api/adopciones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
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
                throw new Error(data.error || data.mensaje || "Error al enviar solicitud");
            }
            
            alert("✅ ¡Solicitud enviada! El refugio se pondrá en contacto contigo pronto.");
            
            // Limpiar localStorage
            localStorage.removeItem("adopcion_animal_id");
            localStorage.removeItem("adopcion_animal_nombre");
            
            // Redirigir al catálogo
            window.location.href = "perros.html";
            
        } catch (error) {
            console.error("Error:", error);
            alert("❌ Error al enviar la solicitud: " + error.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// Cargar información del animal al iniciar
document.addEventListener("DOMContentLoaded", () => {
    cargarInfoAnimal();
});