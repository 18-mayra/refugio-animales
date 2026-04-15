// JS/login.js - Sistema de login con código de verificación (2FA por email)

// Configuración
const API_BASE_URL = window.location.origin;
let userIdGlobal = null;
let tiempoRestante = 0;
let intervaloReloj = null;

// ===============================
// INICIALIZAR PÁGINA
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si ya hay sesión activa
    const token = localStorage.getItem("accessToken");
    if (token) {
        window.location.href = "/";
        return;
    }

    // Configurar elementos del DOM
    configurarElementos();
    
    // Cargar temas guardados
    cargarTema();
});

// ===============================
// CONFIGURAR ELEMENTOS DEL DOM
// ===============================
function configurarElementos() {
    // Formulario de login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", enviarCredenciales);
    }
    
    // Formulario de código
    const codigoForm = document.getElementById("codigoForm");
    if (codigoForm) {
        codigoForm.addEventListener("submit", verificarCodigo);
    }
    
    // Botón de reenviar código
    const reenviarBtn = document.getElementById("reenviarCodigo");
    if (reenviarBtn) {
        reenviarBtn.addEventListener("click", reenviarCodigo);
    }
    
    // Mostrar/ocultar contraseña
    const togglePassword = document.getElementById("togglePassword");
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const passwordInput = document.getElementById("password");
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            togglePassword.textContent = type === "password" ? "👁️" : "🙈";
        });
    }
}

// ===============================
// PASO 1: ENVIAR EMAIL Y CONTRASEÑA
// ===============================
async function enviarCredenciales(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    if (!email || !password) {
        mostrarNotificacion("Por favor, completa todos los campos", "error");
        return;
    }
    
    // Mostrar loading
    mostrarLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.mensaje || data.error || "Error al enviar credenciales");
        }
        
        // Guardar userId para el paso 2
        userIdGlobal = data.userId;
        
        // Mostrar sección del código
        mostrarSeccionCodigo(email);
        
        // Iniciar temporizador de 10 minutos
        iniciarTemporizador(600);
        
        // ✅ NOTIFICACIÓN: Mostrar mensaje que el correo fue enviado
        mostrarNotificacion("📧 ¡Código enviado! Revisa tu bandeja de entrada o la carpeta de SPAM", "exito");
        
    } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion(error.message, "error");
    } finally {
        mostrarLoading(false);
    }
}

// ===============================
// PASO 2: VERIFICAR CÓDIGO Y COMPLETAR LOGIN
// ===============================
async function verificarCodigo(event) {
    event.preventDefault();
    
    const codigo = document.getElementById("codigo").value.trim();
    
    if (!codigo || codigo.length !== 6) {
        mostrarNotificacion("Por favor, ingresa el código de 6 dígitos", "error");
        return;
    }
    
    if (!userIdGlobal) {
        mostrarNotificacion("Error: Identificación de usuario no encontrada. Intenta nuevamente.", "error");
        reiniciarLogin();
        return;
    }
    
    // Mostrar loading
    mostrarLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/verificar-codigo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                userId: userIdGlobal, 
                codigo: codigo 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Código inválido o expirado");
        }
        
        if (data.success && data.accessToken) {
            // Guardar tokens
            localStorage.setItem("accessToken", data.accessToken);
            if (data.refreshToken) {
                localStorage.setItem("refreshToken", data.refreshToken);
            }
            if (data.usuario) {
                localStorage.setItem("usuario", JSON.stringify(data.usuario));
            }
            
            mostrarNotificacion("✅ ¡Bienvenido! Redirigiendo...", "exito");
            
            // Redirigir según el rol
            setTimeout(() => {
                if (data.usuario?.rol === "admin" || data.usuario?.rol === "superadmin") {
                    window.location.href = "/admin.html";
                } else {
                    window.location.href = "/";
                }
            }, 1500);
        } else {
            throw new Error("Respuesta inválida del servidor");
        }
        
    } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion(error.message, "error");
    } finally {
        mostrarLoading(false);
    }
}

// ===============================
// REENVIAR CÓDIGO
// ===============================
async function reenviarCodigo() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    if (!email || !password) {
        mostrarNotificacion("Por favor, ingresa tu email y contraseña nuevamente", "error");
        reiniciarLogin();
        return;
    }
    
    mostrarLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.mensaje || "Error al reenviar código");
        }
        
        userIdGlobal = data.userId;
        
        // Reiniciar temporizador
        if (intervaloReloj) clearInterval(intervaloReloj);
        iniciarTemporizador(600);
        
        mostrarNotificacion("📧 Código reenviado. Revisa tu correo.", "exito");
        
    } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion(error.message, "error");
    } finally {
        mostrarLoading(false);
    }
}

// ===============================
// MOSTRAR SECCIÓN DEL CÓDIGO
// ===============================
function mostrarSeccionCodigo(email) {
    // Ocultar formulario de login
    const loginSection = document.getElementById("loginSection");
    if (loginSection) loginSection.style.display = "none";
    
    // Mostrar sección del código
    const codigoSection = document.getElementById("codigoSection");
    if (codigoSection) {
        codigoSection.style.display = "block";
    }
    
    // Mostrar email del usuario
    const emailSpan = document.getElementById("userEmail");
    if (emailSpan) emailSpan.textContent = email;
    
    // Limpiar campo de código
    const codigoInput = document.getElementById("codigo");
    if (codigoInput) codigoInput.value = "";
    codigoInput?.focus();
}

// ===============================
// INICIAR TEMPORIZADOR
// ===============================
function iniciarTemporizador(segundos) {
    tiempoRestante = segundos;
    actualizarTemporizadorDisplay();
    
    if (intervaloReloj) clearInterval(intervaloReloj);
    
    intervaloReloj = setInterval(() => {
        if (tiempoRestante <= 0) {
            clearInterval(intervaloReloj);
            intervaloReloj = null;
            habilitarReenvio(true);
            actualizarTemporizadorDisplay("Código expirado");
        } else {
            tiempoRestante--;
            actualizarTemporizadorDisplay();
            habilitarReenvio(false);
        }
    }, 1000);
}

// ===============================
// ACTUALIZAR DISPLAY DEL TEMPORIZADOR
// ===============================
function actualizarTemporizadorDisplay(mensaje = null) {
    const timerElement = document.getElementById("timer");
    if (!timerElement) return;
    
    if (mensaje) {
        timerElement.textContent = mensaje;
        timerElement.style.color = "#f44336";
        return;
    }
    
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    timerElement.textContent = `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
    timerElement.style.color = tiempoRestante < 60 ? "#f44336" : "#666";
}

// ===============================
// HABILITAR/DESAHABILITAR BOTÓN REENVIAR
// ===============================
function habilitarReenvio(habilitado) {
    const reenviarBtn = document.getElementById("reenviarCodigo");
    if (!reenviarBtn) return;
    
    reenviarBtn.disabled = !habilitado;
    if (habilitado) {
        reenviarBtn.style.opacity = "1";
        reenviarBtn.style.cursor = "pointer";
    } else {
        reenviarBtn.style.opacity = "0.5";
        reenviarBtn.style.cursor = "not-allowed";
    }
}

// ===============================
// REINICIAR LOGIN (VOLVER AL INICIO)
// ===============================
function reiniciarLogin() {
    if (intervaloReloj) clearInterval(intervaloReloj);
    userIdGlobal = null;
    
    // Ocultar sección del código
    const codigoSection = document.getElementById("codigoSection");
    if (codigoSection) codigoSection.style.display = "none";
    
    // Mostrar formulario de login
    const loginSection = document.getElementById("loginSection");
    if (loginSection) loginSection.style.display = "block";
    
    // Limpiar campos
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    emailInput?.focus();
}

// ===============================
// MOSTRAR NOTIFICACIÓN (ESTILO TOAST)
// ===============================
function mostrarNotificacion(mensaje, tipo = "info") {
    // Crear elemento de notificación
    const notificacion = document.createElement("div");
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
        <div class="notificacion-contenido">
            <span class="notificacion-icono">${tipo === "exito" ? "✅" : tipo === "error" ? "❌" : "ℹ️"}</span>
            <span class="notificacion-mensaje">${mensaje}</span>
        </div>
    `;
    
    // Estilos de la notificación
    notificacion.style.position = "fixed";
    notificacion.style.top = "20px";
    notificacion.style.right = "20px";
    notificacion.style.zIndex = "9999";
    notificacion.style.backgroundColor = tipo === "exito" ? "#4CAF50" : tipo === "error" ? "#f44336" : "#2196F3";
    notificacion.style.color = "white";
    notificacion.style.padding = "15px 20px";
    notificacion.style.borderRadius = "8px";
    notificacion.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    notificacion.style.fontFamily = "Arial, sans-serif";
    notificacion.style.fontSize = "14px";
    notificacion.style.animation = "slideIn 0.3s ease";
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        notificacion.style.animation = "slideOut 0.3s ease";
        setTimeout(() => {
            if (notificacion && notificacion.remove) {
                notificacion.remove();
            }
        }, 300);
    }, 5000);
}

// ===============================
// MOSTRAR LOADING
// ===============================
function mostrarLoading(mostrar) {
    const loginBtn = document.getElementById("loginBtn");
    const verificarBtn = document.getElementById("verificarBtn");
    
    if (loginBtn) {
        loginBtn.disabled = mostrar;
        loginBtn.textContent = mostrar ? "ENVIANDO..." : "INICIAR SESIÓN";
    }
    
    if (verificarBtn) {
        verificarBtn.disabled = mostrar;
        verificarBtn.textContent = mostrar ? "VERIFICANDO..." : "VERIFICAR CÓDIGO";
    }
}

// ===============================
// CARGAR TEMA GUARDADO
// ===============================
function cargarTema() {
    const tema = localStorage.getItem("tema");
    if (tema === "dark") {
        document.body.classList.add("dark-mode");
    }
}

// ===============================
// BOTÓN VOLVER (desde código a login)
// ===============================
function volverALogin() {
    reiniciarLogin();
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);