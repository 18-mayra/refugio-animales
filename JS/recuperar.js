// recuperar.js - Recuperación de contraseña

const API_URL = "https://refugio-animales.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        document.getElementById("paso1").style.display = "none";
        document.getElementById("paso2").style.display = "block";
    }

    document.getElementById("formEmail")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const btn = e.target.querySelector("button");
        const originalText = btn.textContent;
        
        btn.textContent = "📨 Enviando...";
        btn.disabled = true;
        
        try {
            const res = await fetch(API_URL + "/api/password/recuperar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            
            const data = await res.json();
            alert(data.message);
            
            document.getElementById("paso1").style.display = "none";
            document.getElementById("paso2").style.display = "block";
        } catch (error) {
            alert("❌ Error al enviar");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    document.getElementById("formReset")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const codigo = document.getElementById("codigo").value;
        const nueva = document.getElementById("nueva").value;
        const confirmar = document.getElementById("confirmar").value;
        
        if (nueva !== confirmar) {
            alert("❌ Las contraseñas no coinciden");
            return;
        }
        
        if (nueva.length < 6) {
            alert("❌ La contraseña debe tener al menos 6 caracteres");
            return;
        }
        
        const btn = e.target.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "🔒 Restableciendo...";
        btn.disabled = true;
        
        try {
            const res = await fetch(API_URL + "/api/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigo, password: nueva })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                alert("✅ Contraseña actualizada. Redirigiendo...");
                setTimeout(() => { window.location.href = "login.html"; }, 2000);
            } else {
                alert("❌ " + data.message);
            }
        } catch (error) {
            alert("❌ Error al restablecer");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
});