function validarLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    let valido = true;

    document.getElementById("errorEmail").innerText = "";
    document.getElementById("errorPassword").innerText = "";

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        let confirmPassword = document.getElementById("confirmPassword").value;
    document.getElementById("errorConfirm").innerText = "";

    if (password !== confirmPassword) {
        document.getElementById("errorConfirm").innerText =
            "Las contraseñas no coinciden";
        valido = false;
}

    if (!regexEmail.test(email)) {
        document.getElementById("errorEmail").innerText = "Correo inválido";
        valido = false;
    }

    if (password.length < 6) {
        document.getElementById("errorPassword").innerText =
            "Mínimo 6 caracteres";
        valido = false;
    }

    function validarLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    
    // 1. OBTENER EL VALOR DEL CAPTCHA (Esta es la línea que faltaba)
    const captcha = document.getElementById("captchaInput").value; 

    let valido = true;

    // Limpiar errores previos
    document.getElementById("errorEmail").innerText = "";
    document.getElementById("errorPassword").innerText = "";
    document.getElementById("errorConfirm").innerText = "";
    document.getElementById("errorCaptcha").innerText = ""; // Limpiar error captcha

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (password !== confirmPassword) {
        document.getElementById("errorConfirm").innerText = "Las contraseñas no coinciden";
        valido = false;
    }

    if (!regexEmail.test(email)) {
        document.getElementById("errorEmail").innerText = "Correo inválido";
        valido = false;
    }

    if (password.length < 6) {
        document.getElementById("errorPassword").innerText = "Mínimo 6 caracteres";
        valido = false;
    }

    // Validación humana 
    if (Number(captcha) !== 8) {
        document.getElementById("errorCaptcha").innerText = "Respuesta incorrecta. Verificación fallida.";
        valido = false;
    }

    return valido;
}
    return valido;
}
