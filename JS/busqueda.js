function buscarSimple() {
    const texto = document.getElementById("busquedaSimple").value;

    fetch(`http://localhost:3000/busqueda?texto=${texto}`)
        .then(res => res.json())
        .then(data => {
            const contenedor = document.getElementById("resultados");
            contenedor.innerHTML = "";

            if (data.length === 0) {
                contenedor.innerHTML = "<p>No se encontraron resultados</p>";
                return;
            }

            data.forEach(animal => {
                contenedor.innerHTML += `
                    <div class="card">
                        <h3>${animal.nombre} (${animal.tipo})</h3>
                        <p><b>Raza:</b> ${animal.raza}</p>
                        <p><b>Edad:</b> ${animal.edad}</p>
                    </div>
                `;
            });
        });
}
