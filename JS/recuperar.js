// recuperar.js - Recuperación de contraseña

console.log("recuperar.js cargado");

const API_BASE_URL = window.location.origin;
let userIdGlobal = null;
let tiempoRestante = 0;
let intervaloReloj = null;

// ✅ Función para mostrar mensajes en pantalla (NO alerts)
function mostrarMensaje(msg, tipo) {
    const el = document.getElementById("mensaje");
    if (!el) {
        console.warn("Elemento #mensaje no encontrado");
        return;
    }
    
    el.textContent = msg;
    el.className = "mensaje-flotante " + tipo;
    
    // Ocultar después de 6 segundos
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => {
        el.className = "mensaje-flotante";
        el.textContent = "";
    }, 6000);
}

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        document.getElementById("paso1").style.display = "none";
        document.getElementById("paso2").style.display = "block";
    }

    // PASO 1: Enviar email
    document.getElementById("formEmail")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        
        if (!email) {
            mostrarMensaje("❌ Por favor, ingresa tu correo electrónico", "error");
            return;
        }
        
        const btn = e.target.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "📨 Enviando...";
        btn.disabled = true;
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/password/recuperar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || "Error al enviar");
            }
            
            // Guardar userId para el paso 2
            userIdGlobal = data.userId;
            
            mostrarMensaje("📧 Revisa tu correo, recibirás un código de 6 dígitos", "success");
            
            document.getElementById("paso1").style.display = "none";
            document.getElementById("paso2").style.display = "block";
            document.getElementById("userEmail").textContent = email;
            
            // Iniciar temporizador de 15 minutos
            iniciarTemporizador(900);
            
        } catch (error) {
            console.error("Error:", error);
            mostrarMensaje("❌ " + error.message, "error");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // PASO 2: Verificar código y cambiar contraseña
    document.getElementById("formReset")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const codigo = document.getElementById("codigo").value.trim();
        const nueva = document.getElementById("nueva").value;
        const confirmar = document.getElementById("confirmar").value;
        
        if (!codigo || codigo.length !== 6) {
            mostrarMensaje("❌ Por favor, ingresa el código de 6 dígitos", "error");
            return;
        }
        
        if (nueva !== confirmar) {
            mostrarMensaje("❌ Las contraseñas no coinciden", "error");
            return;
        }
        
        if (nueva.length < 6) {
            mostrarMensaje("❌ La contraseña debe tener al menos 6 caracteres", "error");
            return;
        }
        
        if (!userIdGlobal) {
            mostrarMensaje("❌ Error de sesión. Vuelve a intentarlo.", "error");
            location.reload();
            return;
        }
        
        const btn = e.target.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "🔒 Restableciendo...";
        btn.disabled = true;
        
        try {
            // ✅ Enviar userId, codigo y password
            const res = await fetch(`${API_BASE_URL}/api/password/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    userId: userIdGlobal, 
                    codigo: codigo, 
                    password: nueva 
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || "Error al restablecer");
            }
            
            mostrarMensaje("✅ Contraseña actualizada correctamente. Redirigiendo...", "success");
            setTimeout(() => { window.location.href = "login.html"; }, 2000);
            
        } catch (error) {
            console.error("Error:", error);
            mostrarMensaje("❌ " + error.message, "error");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
    
    // Botón reenviar código
    document.getElementById("reenviarCodigo")?.addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        
        if (!email) {
            mostrarMensaje("❌ No se pudo reenviar el código", "error");
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/password/recuperar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || "Error al reenviar");
            }
            
            userIdGlobal = data.userId;
            
            if (intervaloReloj) clearInterval(intervaloReloj);
            iniciarTemporizador(900);
            
            mostrarMensaje("📧 Código reenviado. Revisa tu correo.", "success");
            
        } catch (error) {
            mostrarMensaje("❌ " + error.message, "error");
        }
    });
});

// Temporizador
function iniciarTemporizador(segundos) {
    tiempoRestante = segundos;
    actualizarTimer();
    
    if (intervaloReloj) clearInterval(intervaloReloj);
    
    intervaloReloj = setInterval(() => {
        if (tiempoRestante <= 0) {
            clearInterval(intervaloReloj);
            const timerElement = document.getElementById("timer");
            if (timerElement) {
                timerElement.textContent = "Código expirado";
                timerElement.style.color = "#f44336";
            }
            document.getElementById("reenviarCodigo")?.removeAttribute("disabled");
        } else {
            tiempoRestante--;
            actualizarTimer();
        }
    }, 1000);
}

function actualizarTimer() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    const timerElement = document.getElementById("timer");
    if (timerElement) {
        timerElement.textContent = `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
    }
}