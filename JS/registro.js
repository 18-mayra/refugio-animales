// registro.js - Registro de usuario

console.log("registro.js cargado");

document.addEventListener("DOMContentLoaded", () => {
    generarCaptcha();

    const form = document.getElementById("registroForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

        // Validar CAPTCHA
        const captchaInput = document.getElementById("captchaInput").value;
        const captchaResultado = document.getElementById("captchaResultado").value;

        if (!captchaInput || parseInt(captchaInput) !== parseInt(captchaResultado)) {
            alert("❌ Verificación incorrecta. Vuelve a intentarlo.");
            generarCaptcha();
            document.getElementById("captchaInput").value = "";
            return;
        }

        if (!nombre || !email || !password) {
            alert("Todos los campos son obligatorios");
            return;
        }

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent || "Registrarse";
        if (submitBtn) {
            submitBtn.textContent = "⏳ Registrando...";
            submitBtn.disabled = true;
        }

        try {
            // ✅ CORREGIDO: pasar como objeto, no como parámetros separados
            await window.API.registro({ nombre, email, password });
            alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
            window.location.href = "login.html";
        } catch (error) {
            console.error("❌ ERROR:", error);
            alert("❌ Error al registrar: " + error.message);
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });
});

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