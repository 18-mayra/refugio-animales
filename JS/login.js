// JS/login.js - Login con verificación por email, CAPTCHA y control de intentos

const API_BASE_URL = window.location.origin;
let userIdGlobal = null;
let tiempoRestante = 0;
let intervaloReloj = null;
let intentosFallidos = 0;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");

    if (token) {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
        verificarSesionActiva(token, usuario);
        return;
    }

    generarCaptcha();
    resetearContadorIntentos();

    document.getElementById("loginBtn").onclick = enviarCredenciales;
    document.getElementById("verificarBtn").onclick = verificarCodigo;
    document.getElementById("reenviarCodigo").onclick = reenviarCodigo;
    document.getElementById("volverLoginBtn").onclick = volverALogin;
    
    const toggleBtn = document.getElementById("togglePasswordBtn");
    const passwordInput = document.getElementById("password");
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            toggleBtn.textContent = type === "password" ? "" : "";
        });
    }
});

async function verificarSesionActiva(token, usuario) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/verificar-sesion`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            // ✅ El control de inactividad se inicia automáticamente en control-inactividad.js
            // No lo llamamos aquí para evitar duplicados
            
            if (usuario.rol === "admin" || usuario.rol === "superadmin") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/";
            }
        } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("usuario");
            window.location.href = "login.html";
        }
    } catch (error) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("usuario");
        window.location.href = "login.html";
    }
}

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
        alert("❌ Captcha incorrecto");
        generarCaptcha();
        document.getElementById("captchaInput").value = "";
        return false;
    }
    return true;
}

function registrarIntentoFallido() {
    intentosFallidos++;
    
    if (intentosFallidos >= 3) {
        const btnLogin = document.getElementById("loginBtn");
        btnLogin.disabled = true;
        btnLogin.textContent = "⏳ Cuenta bloqueada - Espera 5 minutos";
        
        setTimeout(() => {
            intentosFallidos = 0;
            btnLogin.disabled = false;
            btnLogin.textContent = "Ingresar";
            alert("🔓 El bloqueo ha expirado. Puedes intentar nuevamente.");
        }, 5 * 60 * 1000);
        
        alert("⚠️ Has superado los 3 intentos fallidos. Cuenta bloqueada por 5 minutos.");
    } else {
        alert(`⚠️ Contraseña incorrecta. Te quedan ${3 - intentosFallidos} intentos antes del bloqueo.`);
    }
}

function resetearContadorIntentos() {
    intentosFallidos = 0;
}

async function enviarCredenciales() {
    if (!validarCaptcha()) return;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Por favor ingresa email y contraseña");
        return;
    }

    const loginBtn = document.getElementById("loginBtn");
    loginBtn.disabled = true;
    loginBtn.textContent = "⏳ Enviando...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                registrarIntentoFallido();
            } else {
                alert(data.error || data.mensaje || "Error al iniciar sesión");
            }
            loginBtn.disabled = false;
            loginBtn.textContent = "Ingresar";
            generarCaptcha();
            return;
        }

        resetearContadorIntentos();
        userIdGlobal = data.userId;

        document.getElementById("loginSection").style.display = "none";
        document.getElementById("codigoSection").style.display = "block";
        document.getElementById("userEmail").textContent = email;

        iniciarTemporizador(600);
        alert("📧 Código enviado a tu correo electrónico (revisa la consola del servidor)");
        
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el servidor");
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Ingresar";
    }
}

async function verificarCodigo() {
    const codigo = document.getElementById("codigo").value.trim();

    if (!userIdGlobal) {
        alert("Error de sesión");
        volverALogin();
        return;
    }

    if (codigo.length !== 6) {
        alert("Ingresa el código de 6 dígitos");
        return;
    }

    const verificarBtn = document.getElementById("verificarBtn");
    verificarBtn.disabled = true;
    verificarBtn.textContent = "⏳ Verificando...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/verificar-codigo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userIdGlobal,
                codigo: codigo
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Código inválido o expirado");
            verificarBtn.disabled = false;
            verificarBtn.textContent = "VERIFICAR CÓDIGO";
            return;
        }

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // ✅ El control de inactividad se iniciará automáticamente en la siguiente página
        // No lo llamamos aquí para evitar duplicados

        alert("✅ Login exitoso");

        const rol = data.usuario.rol;

        setTimeout(() => {
            if (rol === "admin" || rol === "superadmin") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/";
            }
        }, 800);
        
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el servidor");
        verificarBtn.disabled = false;
        verificarBtn.textContent = "VERIFICAR CÓDIGO";
    }
}

async function reenviarCodigo() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const reenviarBtn = document.getElementById("reenviarCodigo");
    reenviarBtn.disabled = true;
    reenviarBtn.textContent = "⏳ Enviando...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/usuarios/login/enviar-codigo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || data.mensaje || "Error al reenviar código");
            return;
        }

        userIdGlobal = data.userId;

        if (intervaloReloj) clearInterval(intervaloReloj);
        iniciarTemporizador(600);
        
        alert("📧 Código reenviado (revisa la consola del servidor)");
        
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión");
    } finally {
        reenviarBtn.disabled = false;
        reenviarBtn.textContent = "Reenviar código";
    }
}

function iniciarTemporizador(segundos) {
    tiempoRestante = segundos;
    const reenviarBtn = document.getElementById("reenviarCodigo");
    reenviarBtn.disabled = true;

    if (intervaloReloj) clearInterval(intervaloReloj);

    intervaloReloj = setInterval(() => {
        if (tiempoRestante <= 0) {
            clearInterval(intervaloReloj);
            document.getElementById("timer").textContent = "Expirado";
            reenviarBtn.disabled = false;
        } else {
            tiempoRestante--;
            const minutos = Math.floor(tiempoRestante / 60);
            const segundosMostrar = tiempoRestante % 60;
            document.getElementById("timer").textContent = 
                `${minutos}:${segundosMostrar.toString().padStart(2, "0")}`;
        }
    }, 1000);
}

function volverALogin() {
    clearInterval(intervaloReloj);
    userIdGlobal = null;
    resetearContadorIntentos();

    document.getElementById("codigoSection").style.display = "none";
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("captchaInput").value = "";
    generarCaptcha();
}