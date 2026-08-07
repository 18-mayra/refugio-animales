// JS/control-inactividad.js - Control de inactividad para usuarios logueados

// ✅ URL DINÁMICA - Funciona en local y producción
const API_BASE_URL = window.location.origin;

let timeoutInactividad = null;
let intervalPing = null;
let controlActivo = false;
let alertaMostrada = false;

function iniciarControlInactividad() {
    if (controlActivo) {
        console.log("⚠️ Control de inactividad ya activo");
        return;
    }
    
    console.log("✅ Iniciando control de inactividad (2 minutos)");
    controlActivo = true;
    alertaMostrada = false;
    
    if (timeoutInactividad) clearTimeout(timeoutInactividad);
    if (intervalPing) clearInterval(intervalPing);
    
    resetearTimeoutInactividad();
    
    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    eventos.forEach(evento => {
        document.removeEventListener(evento, resetearTimeoutInactividad);
        document.addEventListener(evento, resetearTimeoutInactividad);
    });
    
    // Ping cada 30 segundos para verificar que la sesión sigue activa
    intervalPing = setInterval(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            if (intervalPing) clearInterval(intervalPing);
            controlActivo = false;
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/verificar-admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 401) {
                console.log("⚠️ Sesión expirada, redirigiendo a login...");
                await cerrarSesionPorInactividad();
            } else {
                console.log("🔄 Sesión activa");
            }
        } catch (error) {
            console.log("❌ Error en ping:", error);
        }
    }, 30000);
}

function resetearTimeoutInactividad() {
    if (timeoutInactividad) clearTimeout(timeoutInactividad);
    
    // Mostrar alerta de advertencia 30 segundos antes de cerrar
    timeoutInactividad = setTimeout(() => {
        mostrarAlertaInactividad();
    }, 1.5 * 60 * 1000); // 1.5 minutos (90 segundos)
}

function mostrarAlertaInactividad() {
    if (alertaMostrada) return;
    alertaMostrada = true;
    
    // Mostrar alerta de advertencia
    const advertencia = confirm("⚠️ ADVERTENCIA ⚠️\n\nLlevas 1.5 minutos sin actividad.\n\n¿Quieres continuar tu sesión?\n\n- Aceptar: Continuar sesión\n- Cancelar: Cerrar sesión ahora");
    
    if (advertencia) {
        // Usuario quiere continuar - reiniciar contador
        console.log("✅ Usuario activo, reiniciando contador de inactividad");
        alertaMostrada = false;
        resetearTimeoutInactividad();
        
        // Hacer un ping para actualizar la actividad en el servidor
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetch(`${API_BASE_URL}/api/verificar-admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => {});
        }
    } else {
        // Usuario quiere cerrar sesión
        console.log("👋 Usuario solicitó cerrar sesión");
        cerrarSesionPorInactividad();
    }
}

async function cerrarSesionPorInactividad() {
    const token = localStorage.getItem('accessToken');
    
    console.log("⏰ Cerrando sesión por inactividad");
    
    if (intervalPing) {
        clearInterval(intervalPing);
        intervalPing = null;
    }
    controlActivo = false;
    
    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    eventos.forEach(evento => {
        document.removeEventListener(evento, resetearTimeoutInactividad);
    });
    
    if (token) {
        try {
            await fetch(`${API_BASE_URL}/api/usuarios/logout`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (e) {
            console.error("Error al cerrar sesión:", e);
        }
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuario');
    
    // Mostrar mensaje de cierre
    alert("Sesión cerrada por inactividad (2 minutos sin actividad)");
    
    // Redirigir al login
    window.location.href = 'login.html';
}

function verificarYIniciarControl() {
    const token = localStorage.getItem('accessToken');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    if (token && usuario.id) {
        console.log("✅ Usuario logueado:", usuario.email);
        iniciarControlInactividad();
    } else {
        console.log("ℹ️ Usuario no logueado, control de inactividad NO activo");
    }
}

document.addEventListener("DOMContentLoaded", verificarYIniciarControl);