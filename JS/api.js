// api.js - Cliente API para Refugio de Animales

if (!window.API) {

    const BASE_URL = "http://localhost:3000";
    let csrfToken = null;

    const API = {

        async getCSRF() {
            try {
                const res = await fetch(BASE_URL + "/api/csrf-token", {
                    credentials: "include"
                });
                const data = await res.json();
                csrfToken = data.csrfToken;
                console.log("🔐 CSRF Token obtenido:", csrfToken);
                return csrfToken;
            } catch (error) {
                console.error("❌ Error CSRF:", error);
                return null;
            }
        },

        async request(url, options = {}) {
            const token = localStorage.getItem("token");
            const method = options.method || "GET";

            if (!csrfToken && method !== "GET") {
                await this.getCSRF();
            }

            const headers = {
                "Authorization": token ? "Bearer " + token : "",
                "Content-Type": "application/json"
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

            try {
                let res = await fetch(BASE_URL + url, config);

                if (res.status === 403 && method !== "GET") {
                    console.warn("⚠️ Reintentando con nuevo CSRF...");
                    await this.getCSRF();
                    if (csrfToken) {
                        config.headers["CSRF-Token"] = csrfToken;
                    }
                    res = await fetch(BASE_URL + url, config);
                }

                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    throw new Error("Error del servidor");
                }

                if (!res.ok) {
                    throw new Error(data.error || data.mensaje || "Error en la petición");
                }

                return data;

            } catch (error) {
                console.error(`❌ API Error:`, error);
                throw error;
            }
        },

        // ANIMALES
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
            return this.request(`/admin/animales/${id}`, { method: "DELETE" });
        },

        // ADOPCIONES
        aprobarAdopcion(id) {
            return this.request(`/api/adopciones/aprobar/${id}`, { method: "PUT" });
        },

        rechazarAdopcion(id) {
            return this.request(`/api/adopciones/rechazar/${id}`, { method: "PUT" });
        },

        obtenerTodasAdopciones() {
            return this.request("/api/adopciones");
        },

        // USUARIOS
        obtenerUsuarios() {
            return this.request("/api/usuarios/todos");
        },

        obtenerSesiones() {
            return this.request("/api/usuarios/sessions");
        },

        bloquearUsuario(id) {
            return this.request(`/api/usuarios/bloquear/${id}`, { method: "PUT" });
        }
    };

    window.API = API;
    console.log("✅ API inicializada correctamente");
}