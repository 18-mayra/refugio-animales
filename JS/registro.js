// registro.js - Registro de usuario con VALIDACIONES COMPLETAS

console.log("registro.js cargado");

// ✅ URL DINÁMICA - Funciona en local y producción
const API_BASE_URL = window.location.origin;

// Las mismas validaciones que en el backend (para mostrar errores en tiempo real)
function validarPasswordFrontend(password) {
    const errors = [];

    // 1. Longitud mínima de 8 caracteres
    if (password.length < 8) {
        errors.push("La contraseña debe tener al menos 8 caracteres");
    }

    // 2. Mínimo una mayúscula
    if (!/[A-Z]/.test(password)) {
        errors.push("La contraseña debe contener al menos una mayúscula");
    }

    // 3. Mínimo una minúscula
    if (!/[a-z]/.test(password)) {
        errors.push("La contraseña debe contener al menos una minúscula");
    }

    // 4. Mínimo un carácter especial
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) {
        errors.push("La contraseña debe contener al menos un carácter especial");
    }

    // 5. No permitir números consecutivos
    if (tieneNumerosConsecutivos(password)) {
        errors.push("La contraseña no puede tener números consecutivos (ej: 123, 456)");
    }

    // 6. No permitir letras consecutivas
    if (tieneLetrasConsecutivas(password)) {
        errors.push("La contraseña no puede tener letras consecutivas (ej: abc, xyz)");
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function tieneNumerosConsecutivos(password) {
    const numeros = password.match(/\d+/g);
    if (!numeros) return false;
    
    for (let numStr of numeros) {
        for (let i = 0; i <= numStr.length - 3; i++) {
            const n1 = parseInt(numStr[i]);
            const n2 = parseInt(numStr[i + 1]);
            const n3 = parseInt(numStr[i + 2]);
            if (n2 === n1 + 1 && n3 === n2 + 1) return true;
        }
    }
    return false;
}

function tieneLetrasConsecutivas(password) {
    const letras = password.match(/[a-zA-Z]+/g);
    if (!letras) return false;
    
    for (let letraStr of letras) {
        const lower = letraStr.toLowerCase();
        for (let i = 0; i <= lower.length - 3; i++) {
            const c1 = lower.charCodeAt(i);
            const c2 = lower.charCodeAt(i + 1);
            const c3 = lower.charCodeAt(i + 2);
            if (c2 === c1 + 1 && c3 === c2 + 1) return true;
        }
    }
    return false;
}

function actualizarRequisitosUI(password) {
    const validacion = validarPasswordFrontend(password);
    
    // Actualizar cada requisito en la UI (si existen los elementos)
    const req1 = document.getElementById("req1");
    const req2 = document.getElementById("req2");
    const req3 = document.getElementById("req3");
    const req4 = document.getElementById("req4");
    const req5 = document.getElementById("req5");
    const req6 = document.getElementById("req6");
    
    if (req1) {
        req1.innerHTML = password.length >= 8 ? "✓ Mínimo 8 caracteres" : "✗ Mínimo 8 caracteres";
        req1.style.color = password.length >= 8 ? "green" : "red";
    }
    if (req2) {
        req2.innerHTML = /[A-Z]/.test(password) ? "✓ Al menos una mayúscula" : "✗ Al menos una mayúscula";
        req2.style.color = /[A-Z]/.test(password) ? "green" : "red";
    }
    if (req3) {
        req3.innerHTML = /[a-z]/.test(password) ? "✓ Al menos una minúscula" : "✗ Al menos una minúscula";
        req3.style.color = /[a-z]/.test(password) ? "green" : "red";
    }
    if (req4) {
        req4.innerHTML = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password) ? "✓ Al menos un carácter especial" : "✗ Al menos un carácter especial";
        req4.style.color = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password) ? "green" : "red";
    }
    if (req5) {
        req5.innerHTML = !tieneNumerosConsecutivos(password) ? "✓ Sin números consecutivos" : "✗ Sin números consecutivos (123, 456)";
        req5.style.color = !tieneNumerosConsecutivos(password) ? "green" : "red";
    }
    if (req6) {
        req6.innerHTML = !tieneLetrasConsecutivas(password) ? "✓ Sin letras consecutivas" : "✗ Sin letras consecutivas (abc, xyz)";
        req6.style.color = !tieneLetrasConsecutivas(password) ? "green" : "red";
    }
    
    return validacion.isValid;
}

document.addEventListener("DOMContentLoaded", () => {
    generarCaptcha();

    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            actualizarRequisitosUI(passwordInput.value);
        });
    }

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

        // ✅ VALIDACIÓN COMPLETA DE CONTRASEÑA (igual que en el backend)
        const validacion = validarPasswordFrontend(password);
        if (!validacion.isValid) {
            alert("❌ La contraseña no cumple con los requisitos:\n" + validacion.errors.join("\n"));
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent || "Registrarse";
        if (submitBtn) {
            submitBtn.textContent = "⏳ Registrando...";
            submitBtn.disabled = true;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.detalles) {
                    throw new Error(data.detalles.join("\n"));
                }
                throw new Error(data.error || "Error en el registro");
            }

            alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
            window.location.href = "login.html";
        } catch (error) {
            console.error("❌ ERROR:", error);
            alert("❌ Error al registrar:\n" + error.message);
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