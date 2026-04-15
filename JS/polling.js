// polling.js - Notificaciones en tiempo real

let ultimoConteo = 0;
let pollingInterval = null;
const API_BASE_URL = window.location.origin;

async function iniciarPolling() {
    // Detener polling anterior si existe
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Obtener conteo inicial
    try {
        const res = await fetch(`${API_BASE_URL}/animales`);
        const animales = await res.json();
        ultimoConteo = animales.length;
        console.log(`📊 Polling iniciado. Total animales: ${ultimoConteo}`);
    } catch (error) {
        console.error("Error obteniendo conteo inicial:", error);
    }
    
    // Iniciar polling cada 10 segundos (menos frecuente)
    pollingInterval = setInterval(async () => {
        // Solo ejecutar si hay sesión activa
        const token = localStorage.getItem("accessToken");
        if (!token) {
            // No hay sesión, no hacer polling
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/animales`);
            if (!res.ok) throw new Error("Error al obtener animales");
            
            const animales = await res.json();
            const nuevoConteo = animales.length;
            
            if (nuevoConteo > ultimoConteo) {
                const nuevos = nuevoConteo - ultimoConteo;
                notificarNuevoAnimal(nuevos);
                
                // Si hay función para renderizar, llamarla
                if (typeof renderizarAnimales === 'function') {
                    renderizarAnimales(animales);
                }
                
                ultimoConteo = nuevoConteo;
            }
        } catch (error) {
            console.error("Error en polling:", error);
        }
    }, 10000); // cada 10 segundos (menos carga al servidor)
}

function notificarNuevoAnimal(cantidad = 1) {
    // Crear notificación
    const aviso = document.createElement("div");
    aviso.className = "notificacion exito";
    aviso.innerHTML = `
        <span>🐾 ¡${cantidad} nuevo${cantidad > 1 ? 's' : ''} animal${cantidad > 1 ? 'es' : ''} disponible${cantidad > 1 ? 's' : ''} para adopción!</span>
    `;
    aviso.style.position = "fixed";
    aviso.style.top = "20px";
    aviso.style.right = "20px";
    aviso.style.zIndex = "9999";
    aviso.style.backgroundColor = "#4CAF50";
    aviso.style.color = "white";
    aviso.style.padding = "15px 20px";
    aviso.style.borderRadius = "8px";
    aviso.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    aviso.style.animation = "slideIn 0.3s ease";
    
    document.body.appendChild(aviso);
    
    setTimeout(() => {
        aviso.style.animation = "slideOut 0.3s ease";
        setTimeout(() => aviso.remove(), 300);
    }, 5000);
}

function detenerPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log("🛑 Polling detenido");
    }
}

// Reiniciar polling al iniciar sesión (llamar desde login)
function reiniciarPolling() {
    detenerPolling();
    iniciarPolling();
}