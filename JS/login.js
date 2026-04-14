// login.js - Inicio de sesión con MFA (correo real)

console.log("login.js cargado");

let intervaloRenovacion = null;
const API_URL = "https://refugio-animales.onrender.com";

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
                console.log("✅ Token renovado");
            }
        } catch (error) {
            console.error("Error renovando token:", error);
        }
    }, 20 * 60 * 1000);
}

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

function mostrarModalMFA() {
    return new Promise((resolve) => {
        let modal = document.getElementById("mfaModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "mfaModal";
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 350px; width: 90%;">
                    <h3>🔐 Código de verificación</h3>
                    <p>Se ha enviado un código de 6 dígitos a tu correo.</p>
                    <p style="color: #666; font-size: 12px;">Revisa también la carpeta de SPAM</p>
                    <input type="text" id="mfaCodeInput" placeholder="Código de 6 dígitos" maxlength="6" style="width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ccc; border-radius: 8px; text-align: center; font-size: 1.2rem;">
                    <button id="mfaSubmitBtn" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%;">Verificar</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.style.display = "flex";
        
        const input = document.getElementById("mfaCodeInput");
        const btn = document.getElementById("mfaSubmitBtn");
        input.value = "";
        input.focus();
        
        const cleanup = () => {
            modal.style.display = "none";
            input.removeEventListener("keypress", handleKeyPress);
            btn.removeEventListener("click", handleClick);
        };
        
        const handleClick = () => {
            const code = input.value.trim();
            if (code && code.length === 6) {
                cleanup();
                resolve(code);
            } else {
                alert("Ingresa un código de 6 dígitos");
            }
        };
        
        const handleKeyPress = (e) => {
            if (e.key === "Enter") {
                const code = input.value.trim();
                if (code && code.length === 6) {
                    cleanup();
                    resolve(code);
                } else {
                    alert("Ingresa un código de 6 dígitos");
                }
            }
        };
        
        input.addEventListener("keypress", handleKeyPress);
        btn.addEventListener("click", handleClick);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔐 DOM cargado");
    generarCaptcha();

    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("📝 Formulario enviado");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        const captchaInput = document.getElementById("captchaInput").value;
        const captchaResultado = document.getElementById("captchaResultado").value;

        if (!captchaInput || parseInt(captchaInput) !== parseInt(captchaResultado)) {
            alert("❌ Verificación incorrecta");
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
            const data = await window.API.login(email, password);

            if (!data.accessToken || !data.usuario) {
                throw new Error("Respuesta inválida");
            }

            const token = data.accessToken;

            // MFA - ENVIAR CÓDIGO POR CORREO
            console.log("📩 Solicitando código MFA...");
            const mfaSendRes = await fetch(API_URL + "/api/mfa/send", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });

            const mfaData = await mfaSendRes.json();

            if (!mfaSendRes.ok) {
                throw new Error(mfaData.error || "Error al enviar código MFA");
            }

            console.log("📧 Código enviado a tu correo. Revisa también SPAM.");

            // Mostrar modal para ingresar el código
            const codigoIngresado = await mostrarModalMFA();

            // Verificar código
            const mfaVerifyRes = await fetch(API_URL + "/api/mfa/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ code: codigoIngresado })
            });

            const verifyData = await mfaVerifyRes.json();

            if (!mfaVerifyRes.ok) {
                throw new Error(verifyData.error || "Código incorrecto");
            }

            console.log("✅ MFA verificado");

            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            iniciarRenovacionToken();

            const rol = String(data.usuario.rol || "").toLowerCase().trim();
            if (rol === "admin") {
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