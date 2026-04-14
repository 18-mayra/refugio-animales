// 🔹 ENVIAR TOKEN
async function enviarToken() {

  const email = document.getElementById("email").value;

  const res = await fetch("http://localhost:3000/api/password/recuperar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  alert(data.message);

  // mostrar siguiente paso
  document.getElementById("paso1").style.display = "none";
  document.getElementById("paso2").style.display = "block";
}


// 🔹 CAMBIAR PASSWORD
async function cambiarPassword() {

  const token = document.getElementById("token").value;
  const nueva = document.getElementById("nueva").value;

  const res = await fetch("http://localhost:3000/api/password/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      password: nueva
    })
  });

  const data = await res.json();

  alert(data.message);

  // redirigir a login
  window.location.href = "login.html";
}
// recuperar.js - Recuperación de contraseña con código de 6 dígitos

// ===============================
// PASO 1: Enviar email para recibir código
// ===============================
document.getElementById("formEmail")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const btn = e.target.querySelector("button");
    const originalText = btn.textContent;
    const mensajeDiv = document.getElementById("mensaje");
    
    btn.textContent = "📨 Enviando...";
    btn.disabled = true;
    
    try {
        const res = await fetch("http://localhost:3000/api/password/recuperar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        mensajeDiv.innerHTML = `<span style="color:green;">✅ ${data.message}</span>`;
        
        // Mostrar paso 2
        document.getElementById("paso1").style.display = "none";
        document.getElementById("paso2").style.display = "block";
        
    } catch (error) {
        mensajeDiv.innerHTML = `<span style="color:red;">❌ Error al enviar</span>`;
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// ===============================
// PASO 2: Restablecer contraseña con código de 6 dígitos
// ===============================
document.getElementById("formReset")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const codigo = document.getElementById("codigo").value;
    const nueva = document.getElementById("nueva").value;
    const confirmar = document.getElementById("confirmar").value;
    const mensajeDiv = document.getElementById("mensaje");
    
    // Validaciones
    if (nueva !== confirmar) {
        mensajeDiv.innerHTML = `<span style="color:red;">❌ Las contraseñas no coinciden</span>`;
        return;
    }
    
    if (nueva.length < 6) {
        mensajeDiv.innerHTML = `<span style="color:red;">❌ La contraseña debe tener al menos 6 caracteres</span>`;
        return;
    }
    
    if (!/^\d{6}$/.test(codigo)) {
        mensajeDiv.innerHTML = `<span style="color:red;">❌ El código debe ser de 6 dígitos</span>`;
        return;
    }
    
    const btn = e.target.querySelector("button");
    const originalText = btn.textContent;
    btn.textContent = "🔒 Restableciendo...";
    btn.disabled = true;
    
    try {
        const res = await fetch("http://localhost:3000/api/password/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo, password: nueva })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            mensajeDiv.innerHTML = `<span style="color:green;">✅ ${data.message}. Redirigiendo...</span>`;
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            mensajeDiv.innerHTML = `<span style="color:red;">❌ ${data.message}</span>`;
        }
    } catch (error) {
        mensajeDiv.innerHTML = `<span style="color:red;">❌ Error al restablecer</span>`;
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});