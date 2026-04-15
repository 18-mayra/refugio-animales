// data.js - Usando API en lugar de localStorage

const API_BASE_URL = window.location.origin;

const Data = {
    async obtenerAnimales() {
        try {
            const res = await fetch(`${API_BASE_URL}/animales`);
            if (!res.ok) throw new Error("Error al obtener animales");
            return await res.json();
        } catch (error) {
            console.error("Error obteniendo animales:", error);
            return [];
        }
    },

    async obtenerAnimalPorId(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/animales/${id}`);
            if (!res.ok) throw new Error("Animal no encontrado");
            return await res.json();
        } catch (error) {
            console.error("Error obteniendo animal:", error);
            return null;
        }
    },

    async agregarAnimal(animal, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/animales`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(animal)
            });
            if (!res.ok) throw new Error("Error al agregar animal");
            return await res.json();
        } catch (error) {
            console.error("Error agregando animal:", error);
            throw error;
        }
    },

    async eliminarAnimal(id, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/animales/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Error al eliminar animal");
            return await res.json();
        } catch (error) {
            console.error("Error eliminando animal:", error);
            throw error;
        }
    },

    async actualizarAnimal(id, animal, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/animales/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(animal)
            });
            if (!res.ok) throw new Error("Error al actualizar animal");
            return await res.json();
        } catch (error) {
            console.error("Error actualizando animal:", error);
            throw error;
        }
    }
};