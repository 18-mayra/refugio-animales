// 📱 MENU HAMBURGUESA

document.addEventListener("DOMContentLoaded", function() {

    const menuToggle = document.getElementById("menuToggle");
    const menuLinks = document.getElementById("menuLinks");

    if (menuToggle && menuLinks) {
        menuToggle.addEventListener("click", () => {
            menuLinks.classList.toggle("active");
        });
    }

});