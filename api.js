// api.js - Cliente API para Refugio de Animales

if (!window.API) {

    const BASE_URL = window.location.origin;
    let csrfToken = null;

    const API = {

        // ============================================================
        // 🔐 OBTENER CSRF TOKEN
        // ============================================================
        async getCSRF() {
            try {
                const res = await fetch(BASE_URL + "/api/csrf-token", {
                    credentials: "include"
                });
                const data = await res.json();
                csrfToken = data.csrfToken;
                console.log("🔐 CSRF Token obtenido");
                return csrfToken;
            } catch (error) {
                console.error("❌ Error obteniendo CSRF:", error);
                return null;
            }
        },

        // ============================================================
        // 📡 PETICIÓN GENÉRICA
        // ============================================================
        async request(url, options = {}) {
            const token = localStorage.getItem("accessToken");
            const method = options.method || "GET";

            if (!csrfToken && method !== "GET") {
                await this.getCSRF();
            }

            const headers = {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` })
            };

            if (method !== "GET" && csrfToken) {
                headers["CSRF-Token"] = csrfToken;
            }

            const config = {
                method,
                credentials: "include",
                headers
            };

            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            let res = await fetch(BASE_URL + url, config);

            // Si CSRF falla, regenerar y reintentar
            if (res.status === 403 && method !== "GET") {
                console.warn("⚠️ CSRF inválido, regenerando...");
                await this.getCSRF();
                if (csrfToken) {
                    config.headers["CSRF-Token"] = csrfToken;
                }
                res = await fetch(BASE_URL + url, config);
            }

            // Si el token expiró, redirigir al login
            if (res.status === 401) {
                console.warn("⚠️ Token inválido o expirado");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("usuario");
                window.location.href = "/login.html";
                throw new Error("Sesión expirada");
            }

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Respuesta inválida del servidor");
            }

            if (!res.ok) {
                throw new Error(data.error || data.mensaje || "Error en API");
            }

            return data;
        },

        // ============================================================
        // 👤 REGISTRO DE USUARIO
        // ============================================================
        async registro(usuarioData) {
            const res = await fetch(`${BASE_URL}/api/usuarios/registro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(usuarioData)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.mensaje || data.error || "Error en registro");
            }
            
            return data;
        },

        // ============================================================
        // 👤 LOGIN - ✅ CORREGIDO
        // ============================================================
        async login(email, password) {
            const res = await fetch(BASE_URL + "/api/usuarios/login/enviar-codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || data.error || "Error al iniciar sesión");
            }

            return data;
        },

        // ============================================================
        // 👤 VERIFICAR CÓDIGO DE LOGIN
        // ============================================================
        async verificarCodigo(userId, codigo) {
            const res = await fetch(BASE_URL + "/api/usuarios/login/verificar-codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, codigo })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Código inválido o expirado");
            }

            return data;
        },

        // ============================================================
        // 👤 VALIDAR TOKEN
        // ============================================================
        validarToken() {
            return this.request("/api/usuarios/token/validar");
        },

        // ============================================================
        // 👤 OBTENER USUARIOS (ADMIN)
        // ============================================================
        obtenerUsuarios() {
            return this.request("/api/usuarios/todos");
        },

        // ============================================================
        // 👤 BLOQUEAR USUARIO (ADMIN)
        // ============================================================
        bloquearUsuario(id) {
            return this.request(`/api/usuarios/bloquear/${id}`, {
                method: "PUT"
            });
        },

        // ============================================================
        // 🐾 ANIMALES
        // ============================================================
        obtenerAnimales() {
            return this.request("/animales");
        },

        obtenerAnimal(id) {
            return this.request(`/animales/${id}`);
        },

        crearAnimal(animal) {
            return this.request("/admin/animales", {
                method: "POST",
                body: animal
            });
        },

        actualizarAnimal(id, animal) {
            return this.request(`/admin/animales/${id}`, {
                method: "PUT",
                body: animal
            });
        },

        eliminarAnimal(id) {
            return this.request(`/admin/animales/${id}`, {
                method: "DELETE"
            });
        },

        // ============================================================
        // 🐾 ADOPCIONES
        // ============================================================
        crearSolicitud(datos) {
            return this.request("/api/adopciones", {
                method: "POST",
                body: datos
            });
        },

        obtenerAdopciones() {
            return this.request("/api/adopciones");
        },

        aprobarAdopcion(id) {
            return this.request(`/api/adopciones/aprobar/${id}`, {
                method: "PUT"
            });
        },

        rechazarAdopcion(id) {
            return this.request(`/api/adopciones/rechazar/${id}`, {
                method: "PUT"
            });
        },

        // ============================================================
        // 🔐 SESIONES (ADMIN)
        // ============================================================
        obtenerSesiones() {
            return this.request("/api/usuarios/sessions");
        },

        cerrarSesionUsuario(id) {
            return this.request(`/api/sessions/${id}`, {
                method: "DELETE"
            });
        },

        // ============================================================
        // 📧 CONTACTO
        // ============================================================
        enviarContacto(datos) {
            return this.request("/api/contacto", {
                method: "POST",
                body: datos
            });
        },

        // ============================================================
        // 🔍 BÚSQUEDA
        // ============================================================
        buscarAnimales(texto) {
            return this.request(`/busqueda?texto=${encodeURIComponent(texto)}`);
        },

        filtrarAnimales(filtros) {
            const params = new URLSearchParams(filtros);
            return this.request(`/filtro?${params.toString()}`);
        }

    };

    window.API = API;
    console.log("✅ API lista");
}