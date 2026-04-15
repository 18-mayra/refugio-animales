// JS/login.js - Login con verificación por email y sesión funcional

const API_BASE_URL = window.location.origin;

let userIdGlobal = null;
let tiempoRestante = 0;
let intervaloReloj = null;

// ===============================
// INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    // 🔥 SI YA HAY TOKEN → REDIRIGE
    if (token) {
        window.location.href = "/";
        return;
    }

    generarCaptcha();

    document.getElementById("loginBtn").onclick = enviarCredenciales;
    document.getElementById("verificarBtn").onclick = verificarCodigo;
    document.getElementById("reenviarCodigo").onclick = reenviarCodigo;
    document.getElementById("volverLoginBtn").onclick = volverALogin;

    const toggleBtn = document.getElementById("togglePasswordBtn");
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            const pwd = document.getElementById("password");
            pwd.type = pwd.type === "password" ? "text" : "password";
        };
    }
});

// ===============================
// CAPTCHA
// ===============================
function generarCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    document.getElementById("captchaNum1").textContent = num1;
    document.getElementById("captchaNum2").textContent = num2;
    document.getElementById("captchaResultado").value = num1 + num2;
}

function validarCaptcha() {
    const input = document.getElementById("captchaInput").value;
    const resultado = document.getElementById("captchaResultado").value;

    if (parseInt(input) !== parseInt(resultado)) {
        mostrarNotificacion("Captcha incorrecto", "error");
        generarCaptcha();
        document.getElementById("captchaInput").value = "";
        return false;
    }

    return true;
}

// ===============================
// NOTIFICACIONES
// ===============================
function mostrarNotificacion(mensaje, tipo) {
    const notif = document.createElement("div");
    notif.className = `notificacion ${tipo}`;
    notif.textContent = mensaje;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// ===============================
// PASO 1: LOGIN
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
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include", // 🔥 IMPORTANTE
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || data.error || "Error en login");
        }

        userIdGlobal = data.userId;

        document.getElementById("loginSection").style.display = "none";
        document.getElementById("codigoSection").style.display = "block";
        document.getElementById("userEmail").textContent = email;

        iniciarTemporizador(600);

        mostrarNotificacion("Código enviado al correo", "exito");

    } catch (error) {
        console.error(error);
        mostrarNotificacion(error.message, "error");
    }
}

// ===============================
// PASO 2: VERIFICAR CÓDIGO
// ===============================
async function verificarCodigo() {

    const codigo = document.getElementById("codigo").value.trim();

    if (!codigo || codigo.length !== 6) {
        mostrarNotificacion("Código inválido", "error");
        return;
    }

    if (!userIdGlobal) {
        mostrarNotificacion("Error de sesión", "error");
        volverALogin();
        return;
    }

    try {

        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/verificar-codigo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                userId: userIdGlobal,
                codigo
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error al verificar código");
        }

        // 🔥 GUARDAR TOKEN CORRECTO
        localStorage.setItem("token", data.accessToken);

        if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
        }

        if (data.usuario) {
            localStorage.setItem("usuario", JSON.stringify(data.usuario));
        }

        mostrarNotificacion("Login exitoso", "exito");

        setTimeout(() => {
            window.location.href = "/";
        }, 1000);

    } catch (error) {
        console.error(error);
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
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || "Error");
        }

        userIdGlobal = data.userId;

        if (intervaloReloj) clearInterval(intervaloReloj);

        iniciarTemporizador(600);

        mostrarNotificacion("Código reenviado", "exito");

    } catch (error) {
        mostrarNotificacion(error.message, "error");
    }
}

// ===============================
// TEMPORIZADOR
// ===============================
function iniciarTemporizador(segundos) {

    tiempoRestante = segundos;

    if (intervaloReloj) clearInterval(intervaloReloj);

    intervaloReloj = setInterval(() => {

        if (tiempoRestante <= 0) {
            clearInterval(intervaloReloj);
            document.getElementById("timer").textContent = "Expirado";
            document.getElementById("reenviarCodigo").disabled = false;
        } else {
            tiempoRestante--;
            actualizarTimer();
        }

    }, 1000);

    actualizarTimer();
}

function actualizarTimer() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;

    document.getElementById("timer").textContent =
        `${minutos}:${segundos.toString().padStart(2, "0")}`;
}

// ===============================
// VOLVER
// ===============================
function volverALogin() {

    if (intervaloReloj) clearInterval(intervaloReloj);

    userIdGlobal = null;

    document.getElementById("codigoSection").style.display = "none";
    document.getElementById("loginSection").style.display = "block";

    document.getElementById("codigo").value = "";

    generarCaptcha();
}