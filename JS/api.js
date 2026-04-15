// api.js - Cliente API para Refugio de Animales

if (!window.API) {

    const BASE_URL = "https://refugio-animales.onrender.com";
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
        async obtenerAnimales() {
            return this.request("/animales");
        },

        async obtenerAnimal(id) {
            return this.request(`/animales/${id}`);
        },

        async crearAnimal(animal) {
            return this.request("/admin/animales", {
                method: "POST",
                body: animal
            });
        },

        async actualizarAnimal(id, animal) {
            return this.request(`/admin/animales/${id}`, {
                method: "PUT",
                body: animal
            });
        },

        async eliminarAnimal(id) {
            return this.request(`/admin/animales/${id}`, { method: "DELETE" });
        },

        // ADOPCIONES
        async crearSolicitud(datos) {
            return this.request("/api/adopciones", {
                method: "POST",
                body: datos
            });
        },

        async obtenerMisSolicitudes() {
            return this.request("/api/adopciones/mis-solicitudes");
        },

        async obtenerTodasSolicitudes() {
            return this.request("/api/adopciones");
        },

        async aprobarAdopcion(id) {
            return this.request(`/api/adopciones/aprobar/${id}`, { method: "PUT" });
        },

        async rechazarAdopcion(id) {
            return this.request(`/api/adopciones/rechazar/${id}`, { method: "PUT" });
        },

        // USUARIOS
        async login(email, password) {
            const res = await fetch(BASE_URL + "/api/usuarios/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.mensaje || data.error || "Error en login");
            return data;
        },

        async registro(nombre, email, password) {
            return this.request("/api/usuarios/registro", {
                method: "POST",
                body: { nombre, email, password }
            });
        },

        async validarToken() {
            return this.request("/api/usuarios/token/validar");
        },

        async obtenerUsuarios() {
            return this.request("/api/usuarios/todos");
        },

        async bloquearUsuario(id) {
            return this.request(`/api/usuarios/bloquear/${id}`, { method: "PUT" });
        },

        async obtenerSesiones() {
            return this.request("/api/usuarios/sessions");
        },

        // CONTACTO
        async enviarContacto(datos) {
            return this.request("/api/contacto", {
                method: "POST",
                body: datos
            });
        }
    };

    window.API = API;
    console.log("✅ API inicializada correctamente");
}