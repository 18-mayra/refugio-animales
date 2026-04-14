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

// Mostrar modal para ingresar código MFA
function mostrarModalMFA() {
    return new Promise((resolve, reject) => {
        try {
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
                        <input type="text" id="mfaCodeInput" placeholder="Código de 6 dígitos" maxlength="6" style="width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ccc; border-radius: 8px; text-align: center; font-size: 1.2rem;">
                        <button id="mfaSubmitBtn" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Verificar</button>
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
        } catch (error) {
            reject(error);
        }
    });
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

            const mfaData = await mfaSendRes.json();
            console.log("📡 Respuesta MFA:", mfaData);

            if (!mfaSendRes.ok) {
                throw new Error(mfaData.error || "Error al enviar código MFA");
            }

            // Mostrar el código en una alerta
            if (mfaData.debug) {
                alert(`🔐 TU CÓDIGO MFA ES: ${mfaData.debug}\n\nIngrésalo en el siguiente paso.`);
            }

            // 3. MFA - OBTENER CÓDIGO DEL USUARIO (modal o prompt)
            let codigo = null;
            
            try {
                codigo = await mostrarModalMFA();
            } catch (modalError) {
                console.warn("Modal falló, usando prompt:", modalError);
                codigo = prompt("🔐 Ingresa el código MFA de 6 dígitos:");
            }
            
            if (!codigo || codigo.length !== 6) {
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