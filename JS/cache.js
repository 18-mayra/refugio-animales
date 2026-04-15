const Cache = {
  datos: {},

  guardar(clave, valor) {
    this.datos[clave] = valor;
  },

  obtener(clave) {
    return this.datos[clave];
  },

  existe(clave) {
    return this.datos.hasOwnProperty(clave);
  }
};