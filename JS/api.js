// api.js - Cliente API para Refugio de Animales (CORREGIDO)

if (!window.API) {

    const BASE_URL = window.location.origin; // ✅ Usar URL dinámica
    let csrfToken = null;

    const API = {

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

        async request(url, options = {}) {

            // ✅ CORREGIDO: usar 'accessToken' en lugar de 'token'
            const token = localStorage.getItem("accessToken");
            const method = options.method || "GET";

            // Solo pedir CSRF si no es GET
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

            // Reintento si falla CSRF
            if (res.status === 403 && method !== "GET") {
                console.warn("⚠️ CSRF inválido, regenerando...");
                await this.getCSRF();
                if (csrfToken) {
                    config.headers["CSRF-Token"] = csrfToken;
                }
                res = await fetch(BASE_URL + url, config);
            }

            // ✅ Manejo de 401 sin borrar toda la sesión
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

        // 🐾 ANIMALES
        obtenerAnimales() {
            return this.request("/animales");
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

        // 🐾 ADOPCIONES
        crearSolicitud(datos) {
            return this.request("/api/adopciones", {
                method: "POST",
                body: datos
            });
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

        // 👤 USUARIOS
        async login(email, password) {
            const res = await fetch(BASE_URL + "/api/usuarios/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || data.error);
            }

            return data;
        },

        validarToken() {
            return this.request("/api/usuarios/token/validar");
        }

    };

    window.API = API;
    console.log("✅ API lista");
}