// login.js - Inicio de sesión con CAPTCHA y MFA

console.log("login.js cargado");

document.addEventListener("DOMContentLoaded", () => {
    generarCaptcha();

    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

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
            // =========================
            // 1. LOGIN
            // =========================
            const res = await fetch("http://localhost:3000/api/usuarios/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || data.error || "Error en login");
            }

            if (!data.accessToken || !data.usuario) {
                throw new Error("Respuesta inválida del servidor");
            }

            const token = data.accessToken;
            console.log("✅ Login exitoso");

            // =========================
            // 2. MFA - Enviar código
            // =========================
            console.log("📩 Enviando código MFA...");

            const mfaSendRes = await fetch("http://localhost:3000/api/mfa/send", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            let mfaData;
            try {
                mfaData = await mfaSendRes.json();
            } catch (e) {
                throw new Error("Error al enviar código MFA");
            }

            if (!mfaSendRes.ok) {
                throw new Error(mfaData.error || "Error al enviar código MFA");
            }

            console.log("📧 Código MFA enviado");
            if (mfaData.debug) {
                console.log("🔐 CÓDIGO:", mfaData.debug);
            }

            // =========================
            // 3. MFA - Pedir código al usuario
            // =========================
            const codigo = prompt("🔐 Se ha enviado un código de verificación a tu correo.\n\nIngresa el código de 6 dígitos:");

            if (!codigo || codigo.length < 6) {
                throw new Error("Código MFA inválido");
            }

            // =========================
            // 4. MFA - Verificar código
            // =========================
            const mfaVerifyRes = await fetch("http://localhost:3000/api/mfa/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ code: codigo })
            });

            let verifyData;
            try {
                verifyData = await mfaVerifyRes.json();
            } catch (e) {
                throw new Error("Error al verificar código");
            }

            if (!mfaVerifyRes.ok) {
                throw new Error(verifyData.error || "Código incorrecto");
            }

            console.log("✅ MFA verificado");

            // =========================
            // 5. GUARDAR DATOS
            // =========================
            localStorage.setItem("token", token);
            if (data.refreshToken) {
                localStorage.setItem("refreshToken", data.refreshToken);
            }
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            // =========================
            // 6. REDIRECCIÓN
            // =========================
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