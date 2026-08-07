// JS/aviso-privacidad.js - Verificación del Aviso de Privacidad en TODAS las páginas

// ✅ URL DINÁMICA - Funciona en local y producción
const AVISO_PRIVACIDAD_URL = '/aviso-privacidad.html';

function verificarAvisoPrivacidad() {
    // ... código igual ...
}

function verificarAvisoPrivacidad() {
    const avisoAceptado = localStorage.getItem('avisoPrivacidadAceptado');
    const paginaActual = window.location.pathname;
    
    console.log('🔍 Verificando aviso en:', paginaActual);
    console.log('📋 Estado:', avisoAceptado === 'true' ? 'Aceptado ✅' : 'No aceptado ❌');
    
    // Si ya está en la página del aviso, NO redirigir (evitar bucle)
    if (paginaActual.includes('aviso-privacidad.html')) {
        console.log('📋 Estamos en la página del aviso, no redirigir');
        return true;
    }
    
    // Si NO ha aceptado el aviso, redirigir a la página del aviso
    if (avisoAceptado !== 'true') {
        console.log('⚠️ Usuario NO ha aceptado el Aviso de Privacidad');
        console.log('🔀 Redirigiendo a:', AVISO_PRIVACIDAD_URL);
        window.location.href = AVISO_PRIVACIDAD_URL;
        return false;
    }
    
    console.log('✅ Aviso de Privacidad aceptado');
    return true;
}

// Función para reiniciar el aviso (para pruebas)
function reiniciarAvisoPrivacidad() {
    if (confirm('¿Reiniciar el aviso de privacidad?')) {
        localStorage.removeItem('avisoPrivacidadAceptado');
        localStorage.removeItem('avisoPrivacidadFecha');
        window.location.href = AVISO_PRIVACIDAD_URL;
    }
}

// Ejecutar automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", function() {
    console.log('🚀 Iniciando verificación de aviso de privacidad...');
    verificarAvisoPrivacidad();
});