(function() {
    const lat = 41.388364;
    const lng = 2.1638688;
    const mapa = L.map('mapa-inicio').setView([lat, lng], 13);

    let markers = new L.FeatureGroup().addTo(mapa);
    let propiedades = [];

    // Filtros
    const filtros = {
        categoria: '',
        precio: ''
    };

    const categoriasSelect = document.querySelector('#categorias');
    const preciosSelect = document.querySelector('#precios');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    // Filtrado de categorías y precios
    categoriasSelect.addEventListener('change', e => {
        filtros.categoria = +e.target.value;
        filtrarPropiedades();
    });

    preciosSelect.addEventListener('change', e => {
        filtros.precio = +e.target.value;
        filtrarPropiedades();
    });

    // Función para obtener propiedades desde la API
    const obtenerPropiedades = async () => {
        try {
            const url = '/api/propiedades';
            const respuesta = await fetch(url);
            propiedades = await respuesta.json();
            console.log('Propiedades obtenidas:', propiedades);

            filtrarPropiedades(); // Filtra las propiedades después de obtenerlas

        } catch (error) {
            console.log(error);
        }
    };

    // Función para mostrar propiedades en el mapa
    const mostrarPropiedades = propiedades => {
        markers.clearLayers(); // Limpiar los marcadores existentes

        propiedades.forEach(propiedad => {
            if (propiedad.lat && propiedad.lng) {
                const marker = new L.marker([propiedad.lat, propiedad.lng], {
                    autoPan: true
                })
                .addTo(mapa)
                .bindPopup(`
                    <p class="text-indigo-600 font-bold">${propiedad.categoria.nombre}</p>
                    <h1 class="text-xl font-bold uppercase my-3">${propiedad.titulo}</h1>
                    <img src="/uploads/${propiedad.imagen}" alt="Imagen de la propiedad ${propiedad.titulo}">
                    <p class="text-gray-600 font-bold">${propiedad.precio.nombre}</p>
                    <a href="/propiedad/${propiedad.id}" class="bg-yellow-400 block p-2 text-center font-bold uppercase text-gray-800 rounded">Ver Propiedad</a>
                `);
                markers.addLayer(marker);
            } else {
                console.warn('Propiedad sin coordenadas:', propiedad);
            }
        });
    };

    // Filtrar propiedades según los filtros seleccionados
    const filtrarPropiedades = () => {
        const resultado = propiedades
            .filter(filtrarCategoria)
            .filter(filtrarPrecio);

        console.log('Propiedades filtradas:', resultado); // Verifica los resultados filtrados

        mostrarPropiedades(resultado);
    };

    // Filtrar por categoría
    const filtrarCategoria = propiedad => {
        return filtros.categoria ? propiedad.categoriaId === filtros.categoria : true;
    };

    // Filtrar por precio
    const filtrarPrecio = propiedad => {
        return filtros.precio ? propiedad.precioId === filtros.precio : true;
    };

    // Cargar propiedades iniciales al cargar la página
    obtenerPropiedades();
})();
