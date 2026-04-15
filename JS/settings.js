async function cambiarPass() {
    const token = localStorage.getItem("accessToken");
    const pass = document.getElementById("pass").value;
    const API_BASE_URL = window.location.origin;
    
    if (!pass || pass.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/settings/password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ nueva: pass })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al cambiar contraseña");
        }
        
        alert("✅ Contraseña actualizada correctamente");
        document.getElementById("pass").value = "";
        
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error: " + error.message);
    }
}