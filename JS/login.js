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
        mostrarError("Por favor, completa todos los campos");
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
        iniciarTemporizador(600); // 10 minutos = 600 segundos
        
        mostrarExito("📧 Código enviado a tu correo electrónico");
        
    } catch (error) {
        console.error("Error:", error);
        mostrarError(error.message);
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
        mostrarError("Por favor, ingresa el código de 6 dígitos");
        return;
    }
    
    if (!userIdGlobal) {
        mostrarError("Error: Identificación de usuario no encontrada. Intenta nuevamente.");
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
            
            mostrarExito("✅ ¡Bienvenido! Redirigiendo...");
            
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
        mostrarError(error.message);
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
        mostrarError("Por favor, ingresa tu email y contraseña nuevamente");
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
        
        mostrarExito("📧 Código reenviado. Revisa tu correo.");
        
    } catch (error) {
        console.error("Error:", error);
        mostrarError(error.message);
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
// MOSTRAR ERROR
// ===============================
function mostrarError(mensaje) {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = "block";
        errorDiv.style.color = "#f44336";
        setTimeout(() => {
            errorDiv.style.display = "none";
        }, 5000);
    } else {
        alert(mensaje);
    }
}

// ===============================
// MOSTRAR ÉXITO
// ===============================
function mostrarExito(mensaje) {
    const successDiv = document.getElementById("successMessage");
    if (successDiv) {
        successDiv.textContent = mensaje;
        successDiv.style.display = "block";
        successDiv.style.color = "#4CAF50";
        setTimeout(() => {
            successDiv.style.display = "none";
        }, 5000);
    }
}

// ===============================
// MOSTRAR LOADING
// ===============================
function mostrarLoading(mostrar) {
    const loadingDiv = document.getElementById("loadingSpinner");
    const loginBtn = document.getElementById("loginBtn");
    const verificarBtn = document.getElementById("verificarBtn");
    
    if (loadingDiv) {
        loadingDiv.style.display = mostrar ? "block" : "none";
    }
    
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