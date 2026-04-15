// contactanos.js - Formulario de contacto

const API_URL = "https://refugio-animales.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formContacto");
    const respuesta = document.getElementById("respuesta");
    
    if (!form) return;
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById("nombre")?.value || "";
        const email = document.getElementById("email")?.value || "";
        const telefono = document.getElementById("telefono")?.value || "";
        const mensaje = document.getElementById("mensaje")?.value || "";
        
        if (!nombre || !email || !mensaje) {
            alert("❌ Por favor completa todos los campos obligatorios");
            return;
        }
        
        const btn = form.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "📨 Enviando...";
        btn.disabled = true;
        
        try {
            const res = await fetch(API_URL + "/api/contacto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, email, telefono, mensaje })
            });
            
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);
            
            alert("✅ ¡Mensaje enviado! Te llegará una confirmación a tu correo.");
            form.reset();
            if (respuesta) {
                respuesta.innerHTML = '<span style="color:green;">✅ Mensaje enviado correctamente</span>';
                setTimeout(() => { respuesta.innerHTML = ""; }, 5000);
            }
        } catch (error) {
            alert("❌ Error al enviar: " + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
});