// JS/login.js - Login con verificación por email y mantenimiento de sesión

const API_BASE_URL = window.location.origin;
let userIdGlobal = null;
let tiempoRestante = 0;
let intervaloReloj = null;

// ===============================
// INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si ya hay sesión activa
    const token = localStorage.getItem("accessToken");
    if (token) {
        // ✅ Redirigir según rol si ya hay sesión
        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
        if (usuario.rol === "admin" || usuario.rol === "superadmin") {
            window.location.href = "/admin.html";
        } else {
            window.location.href = "/";
        }
        return;
    }
    
    generarCaptcha();
    
    // Configurar eventos
    document.getElementById("loginBtn").onclick = enviarCredenciales;
    document.getElementById("verificarBtn").onclick = verificarCodigo;
    document.getElementById("reenviarCodigo").onclick = reenviarCodigo;
    document.getElementById("volverLoginBtn").onclick = volverALogin;
    
    // Mostrar/ocultar contraseña
    const toggleBtn = document.getElementById("togglePasswordBtn");
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            const pwd = document.getElementById("password");
            pwd.type = pwd.type === "password" ? "text" : "password";
        };
    }
});

// ===============================
// GENERAR CAPTCHA
// ===============================
function generarCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    document.getElementById("captchaNum1").textContent = num1;
    document.getElementById("captchaNum2").textContent = num2;
    document.getElementById("captchaResultado").value = num1 + num2;
}

// ===============================
// VALIDAR CAPTCHA
// ===============================
function validarCaptcha() {
    const input = document.getElementById("captchaInput").value;
    const resultado = document.getElementById("captchaResultado").value;
    if (parseInt(input) !== parseInt(resultado)) {
        mostrarNotificacion("❌ Captcha incorrecto", "error");
        generarCaptcha();
        document.getElementById("captchaInput").value = "";
        return false;
    }
    return true;
}

// ===============================
// MOSTRAR NOTIFICACIÓN
// ===============================
function mostrarNotificacion(mensaje, tipo) {
    const notif = document.createElement("div");
    notif.className = `notificacion ${tipo}`;
    notif.innerHTML = `<span>${tipo === "exito" ? "✅" : "❌"} ${mensaje}</span>`;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// ===============================
// PASO 1: ENVIAR CREDENCIALES
// ===============================
async function enviarCredenciales() {
    if (!validarCaptcha()) return;
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    if (!email || !password) {
        mostrarNotificacion("Completa todos los campos", "error");
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.mensaje || data.error);
        
        userIdGlobal = data.userId;
        
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("codigoSection").style.display = "block";
        document.getElementById("userEmail").textContent = email;
        
        iniciarTemporizador(600);
        mostrarNotificacion("📧 Código enviado a tu correo", "exito");
        
    } catch (error) {
        mostrarNotificacion(error.message, "error");
    }
}

// ===============================
// PASO 2: VERIFICAR CÓDIGO
// ===============================
async function verificarCodigo() {
    const codigo = document.getElementById("codigo").value.trim();
    
    if (!codigo || codigo.length !== 6) {
        mostrarNotificacion("Ingresa el código de 6 dígitos", "error");
        return;
    }
    
    if (!userIdGlobal) {
        mostrarNotificacion("Error: Identificación no encontrada", "error");
        volverALogin();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/verificar-codigo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userIdGlobal, codigo })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        // ✅ GUARDAR TOKEN Y SESIÓN
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        if (data.usuario) localStorage.setItem("usuario", JSON.stringify(data.usuario));
        
        mostrarNotificacion("✅ ¡Bienvenido " + (data.usuario?.nombre || "") + "!", "exito");
        
        // ✅ REDIRECCIÓN SEGÚN ROL
        setTimeout(() => {
            const rol = data.usuario?.rol || "";
            if (rol === "admin" || rol === "superadmin") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/";
            }
        }, 1500);
        
    } catch (error) {
        mostrarNotificacion(error.message, "error");
    }
}

// ===============================
// REENVIAR CÓDIGO
// ===============================
async function reenviarCodigo() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.mensaje);
        
        userIdGlobal = data.userId;
        
        if (intervaloReloj) clearInterval(intervaloReloj);
        iniciarTemporizador(600);
        mostrarNotificacion("📧 Código reenviado", "exito");
        
    } catch (error) {
        mostrarNotificacion(error.message, "error");
    }
}

// ===============================
// TEMPORIZADOR
// ===============================
function iniciarTemporizador(segundos) {
    tiempoRestante = segundos;
    actualizarTimer();
    
    if (intervaloReloj) clearInterval(intervaloReloj);
    
    intervaloReloj = setInterval(() => {
        if (tiempoRestante <= 0) {
            clearInterval(intervaloReloj);
            document.getElementById("reenviarCodigo").disabled = false;
            document.getElementById("timer").textContent = "Código expirado";
        } else {
            tiempoRestante--;
            actualizarTimer();
        }
    }, 1000);
}

function actualizarTimer() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    document.getElementById("timer").textContent = `${minutos}:${segundos.toString().padStart(2, "0")}`;
}

// ===============================
// VOLVER AL LOGIN
// ===============================
function volverALogin() {
    if (intervaloReloj) clearInterval(intervaloReloj);
    userIdGlobal = null;
    
    document.getElementById("codigoSection").style.display = "none";
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("codigo").value = "";
    generarCaptcha();
}