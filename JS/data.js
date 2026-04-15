// data.js

const Data = {
  obtenerAnimales() {
    return JSON.parse(localStorage.getItem("animales")) || [];
  },

  guardarAnimales(animales) {
    localStorage.setItem("animales", JSON.stringify(animales));
  },

  agregarAnimal(animal) {
    const animales = this.obtenerAnimales();
    animales.push(animal);
    localStorage.setItem("animales", JSON.stringify(animales));
  },

  eliminarAnimal(id) {
    let animales = this.obtenerAnimales();
    animales = animales.filter(a => a.id !== id);
    this.guardarAnimales(animales);
  },

  actualizarAnimal(animalActualizado) {
    const animales = this.obtenerAnimales().map(a =>
      a.id === animalActualizado.id ? animalActualizado : a
    );
    this.guardarAnimales(animales);
  }
};
