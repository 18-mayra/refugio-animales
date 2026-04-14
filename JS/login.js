// login.js - Inicio de sesión con MFA y renovación de token

console.log("login.js cargado - VERSIÓN CON MFA");

let intervaloRenovacion = null;
const API_URL = "https://refugio-animales.onrender.com";

// Renovación automática del token
function iniciarRenovacionToken() {
    if (intervaloRenovacion) clearInterval(intervaloRenovacion);
    
    intervaloRenovacion = setInterval(async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return;
        
        try {
            const res = await fetch(API_URL + "/api/usuarios/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            });
            
            const data = await res.json();
            if (res.ok && data.accessToken) {
                localStorage.setItem("token", data.accessToken);
                console.log("✅ Token renovado automáticamente");
            }
        } catch (error) {
            console.error("Error renovando token:", error);
        }
    }, 20 * 60 * 1000);
}

// Generar CAPTCHA aleatorio
function generarCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const resultado = num1 + num2;
    
    const captchaNum1 = document.getElementById("captchaNum1");
    const captchaNum2 = document.getElementById("captchaNum2");
    const captchaResultado = document.getElementById("captchaResultado");
    
    if (captchaNum1) captchaNum1.textContent = num1;
    if (captchaNum2) captchaNum2.textContent = num2;
    if (captchaResultado) captchaResultado.value = resultado;
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔐 DOM cargado - Inicializando login con MFA");
    generarCaptcha();

    const form = document.getElementById("loginForm");
    if (!form) {
        console.error("❌ Formulario de login no encontrado");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("📝 Formulario enviado");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        // Validar CAPTCHA
        const captchaInput = document.getElementById("captchaInput").value;
        const captchaResultado = document.getElementById("captchaResultado").value;

        if (!captchaInput || parseInt(captchaInput) !== parseInt(captchaResultado)) {
            alert("❌ Verificación incorrecta. Vuelve a intentarlo.");
            generarCaptcha();
            document.getElementById("captchaInput").value = "";
            return;
        }

        if (!email || !password) {
            alert("Todos los campos son obligatorios");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent || "Ingresar";
        if (submitBtn) {
            submitBtn.textContent = "⏳ Cargando...";
            submitBtn.disabled = true;
        }

        try {
            // 1. LOGIN
            console.log("📡 Enviando login...");
            const data = await window.API.login(email, password);

            if (!data.accessToken || !data.usuario) {
                throw new Error("Respuesta inválida del servidor");
            }

            const token = data.accessToken;
            console.log("✅ Login exitoso");

            // 2. MFA - ENVIAR CÓDIGO
            console.log("📩 Enviando código MFA...");
            const mfaSendRes = await fetch(API_URL + "/api/mfa/send", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });

            console.log("📡 Respuesta MFA send:", mfaSendRes.status);

            if (!mfaSendRes.ok) {
                const errorText = await mfaSendRes.text();
                console.error("Error MFA send:", errorText);
                throw new Error("Error al enviar código MFA");
            }

            // 3. MFA - PEDIR CÓDIGO AL USUARIO
            const codigo = prompt("🔐 Se ha enviado un código de 6 dígitos a tu correo.\n\nIngresa el código:");

            if (!codigo || codigo.length < 6) {
                throw new Error("Código MFA inválido");
            }

            // 4. MFA - VERIFICAR CÓDIGO
            console.log("🔍 Verificando código MFA...");
            const mfaVerifyRes = await fetch(API_URL + "/api/mfa/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ code: codigo })
            });

            const verifyData = await mfaVerifyRes.json();

            if (!mfaVerifyRes.ok) {
                throw new Error(verifyData.error || "Código incorrecto");
            }

            console.log("✅ MFA verificado correctamente");

            // 5. GUARDAR DATOS
            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            // 6. RENOVACIÓN AUTOMÁTICA
            iniciarRenovacionToken();

            // 7. REDIRECCIÓN
            const rol = String(data.usuario.rol || "").toLowerCase().trim();
            console.log("👑 Rol:", rol);

            if (rol === "admin" || rol === "superadmin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }

        } catch (error) {
            console.error("❌ ERROR:", error);
            alert("❌ " + error.message);
            generarCaptcha();
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });
});