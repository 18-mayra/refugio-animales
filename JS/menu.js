// 📱 MENÚ HAMBURGUESA Y SUBMENÚ - VERSIÓN CORREGIDA

document.addEventListener("DOMContentLoaded", function() {
    
    console.log("🔧 Inicializando menú...");
    
    // ===============================
    // ELEMENTOS DEL DOM
    // ===============================
    const menuToggle = document.getElementById("menuToggle");
    const menuLinks = document.getElementById("menuLinks");
    const submenuBtn = document.querySelector(".submenu-btn");
    const submenuLinks = document.querySelector(".submenu-links");
    
    // ===============================
    // 1. MENÚ HAMBURGUESA (abrir/cerrar)
    // ===============================
    if (menuToggle && menuLinks) {
        menuToggle.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            menuLinks.classList.toggle("active");
            console.log("Menú hamburguesa:", menuLinks.classList.contains("active") ? "abierto" : "cerrado");
        });
    } else {
        console.log("⚠️ No se encontró menuToggle o menuLinks");
        console.log("menuToggle:", menuToggle);
        console.log("menuLinks:", menuLinks);
    }
    
    // ===============================
    // 2. SUBMENÚ CATÁLOGO (móvil y desktop)
    // ===============================
    if (submenuBtn && submenuLinks) {
        // Para móvil: clic muestra/oculta
        submenuBtn.addEventListener("click", function(e) {
            // En móvil (pantalla pequeña)
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                submenuLinks.classList.toggle("open");
                console.log("Submenú:", submenuLinks.classList.contains("open") ? "abierto" : "cerrado");
            }
        });
        
        // Para desktop: mostrar al hover (lo maneja CSS)
    } else {
        console.log("⚠️ No se encontró submenuBtn o submenuLinks");
    }
    
    // ===============================
    // 3. Cerrar menú al hacer clic en un enlace
    // ===============================
    if (menuLinks) {
        const allLinks = menuLinks.querySelectorAll("a");
        allLinks.forEach(function(link) {
            link.addEventListener("click", function() {
                menuLinks.classList.remove("active");
                // También cerrar submenú en móvil
                if (submenuLinks && window.innerWidth <= 768) {
                    submenuLinks.classList.remove("open");
                }
            });
        });
    }
    
    // ===============================
    // 4. Cerrar menú al hacer clic fuera
    // ===============================
    document.addEventListener("click", function(e) {
        if (menuLinks && menuLinks.classList.contains("active")) {
            // Si el clic no fue en el botón hamburguesa ni en el menú
            if (menuToggle && !menuToggle.contains(e.target) && !menuLinks.contains(e.target)) {
                menuLinks.classList.remove("active");
            }
        }
    });
    
    // ===============================
    // 5. Al redimensionar, resetear menús
    // ===============================
    window.addEventListener("resize", function() {
        if (window.innerWidth > 768) {
            if (menuLinks) menuLinks.classList.remove("active");
            if (submenuLinks) submenuLinks.classList.remove("open");
            if (submenuLinks) submenuLinks.style.display = "";
        }
    });
    
    console.log("✅ Menú hamburguesa inicializado correctamente");
});