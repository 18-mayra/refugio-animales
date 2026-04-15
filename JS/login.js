// JS/login.js - Login con verificación por email

const API_BASE_URL = window.location.origin;
let userIdGlobal = null;
let tiempoRestante = 0;
let intervaloReloj = null;

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("accessToken");

    if (token) {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

        if (usuario.rol === "admin" || usuario.rol === "superadmin") {
            window.location.href = "/admin.html";
        } else {
            window.location.href = "/";
        }
        return;
    }

    generarCaptcha();

    document.getElementById("loginBtn").onclick = enviarCredenciales;
    document.getElementById("verificarBtn").onclick = verificarCodigo;
    document.getElementById("reenviarCodigo").onclick = reenviarCodigo;
    document.getElementById("volverLoginBtn").onclick = volverALogin;
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
        alert("Captcha incorrecto");
        generarCaptcha();
        return false;
    }
    return true;
}

// ===============================
// LOGIN - ENVIAR CÓDIGO
// ===============================
async function enviarCredenciales() {
    if (!validarCaptcha()) return;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.mensaje || "Error login");
        return;
    }

    userIdGlobal = data.userId;

    document.getElementById("loginSection").style.display = "none";
    document.getElementById("codigoSection").style.display = "block";

    iniciarTemporizador(600);

    alert("Código enviado al correo");
}

// ===============================
// VERIFICAR CÓDIGO
// ===============================
async function verificarCodigo() {
    const codigo = document.getElementById("codigo").value.trim();

    if (!userIdGlobal) {
        alert("Error de sesión");
        return;
    }

    const response = await fetch(`${API_BASE_URL}/api/usuarios/login/verificar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: userIdGlobal,
            codigo
        })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.error || "Error");
        return;
    }

    // ===============================
    // 🔥 GUARDAR SESIÓN (IMPORTANTE)
    // ===============================
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    alert("Login exitoso");

    const rol = data.usuario.rol;

    setTimeout(() => {
        if (rol === "admin" || rol === "superadmin") {
            window.location.href = "/admin.html";
        } else {
            window.location.href = "/";
        }
    }, 800);
}

// ===============================
// REENVIAR CÓDIGO
// ===============================
async function reenviarCodigo() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.mensaje || "Error");
        return;
    }

    userIdGlobal = data.userId;

    iniciarTemporizador(600);

    alert("Código reenviado");
}

// ===============================
// TIMER
// ===============================
function iniciarTemporizador(segundos) {
    tiempoRestante = segundos;

    if (intervaloReloj) clearInterval(intervaloReloj);

    intervaloReloj = setInterval(() => {
        tiempoRestante--;

        const minutos = Math.floor(tiempoRestante / 60);
        const segundos = tiempoRestante % 60;

        document.getElementById("timer").textContent =
            `${minutos}:${segundos.toString().padStart(2, "0")}`;

        if (tiempoRestante <= 0) {
            clearInterval(intervaloReloj);
            document.getElementById("timer").textContent = "Expirado";
        }
    }, 1000);
}

// ===============================
function volverALogin() {
    clearInterval(intervaloReloj);
    userIdGlobal = null;

    document.getElementById("codigoSection").style.display = "none";
    document.getElementById("loginSection").style.display = "block";
}