import { Sequelize } from 'sequelize';
import { Precio, Categoria, Propiedad } from '../models/index.js'

const inicio = async(req, res) => {

    // Realiza dos consultas a la base de datos en paralelo usando Promise.all
    // Las obtiene en formato crudo (raw)
    const [ categorias, precios, casas, pisos ] = await Promise.all([
        Categoria.findAll({ raw: true }), 
        Precio.findAll({raw: true}), 

        Propiedad.findAll({ //Consulta para las casas
            limit: 3,
            where: {
                categoriaId: 1
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }),
        Propiedad.findAll({ //Consulta para los pisos
            limit: 3,
            where: {
                categoriaId: 2
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        })     
    ]);
   
    res.render('inicio', {
        pagina: 'Inicio',
        categorias,
        precios,
        casas,
        pisos,
        csrfToken: req.csrfToken()
    }) 
}

const categoria = async (req, res) => {
    const { id } = req.params
    console.log(id);
    // Comprobar que la categoría exista
    const categoria = await Categoria.findByPk(id)
    if (!categoria) {
        return res.redirect('/404')
    }

    // Obtener propiedades de la categoría
    const propiedades = await Propiedad.findAll({
        where: {
            categoriaId: id
        },
        include: [
            { model: Precio, as: 'precio' }
        ]
    })
    res.render('categoria', {
        pagina: `${categoria.nombre} en Venta`,
        propiedades,
        csrfToken: req.csrfToken()
    })
}

const noEncontrado = (req, res) => {
    res.render('404', {
        pagina: 'No Encontrada',
        csrfToken: req.csrfToken()
    })
}

const buscador = async (req, res) => {
    // Extrae el término de búsqueda del cuerpo de la solicitud
    const { termino } = req.body;
    
    // Validar que el término no esté vacío
    // Si el término está vacío (o solo contiene espacios), redirige al usuario a la página anterior
    if (!termino.trim()) {
        return res.redirect('back');
    }

    // Realiza la consulta a la base de datos para buscar propiedades que coincidan con el término
    // La búsqueda se realiza en el campo 'titulo' de la propiedad usando el operador LIKE
    const propiedades = await Propiedad.findAll({
        where: {
            titulo: {
                [Sequelize.Op.like]: '%' + termino + '%'  // `%` en ambos lados de `termino` permite búsqueda parcial en cualquier lugar del título
            }
        },
        include: [
            // Incluye la información del modelo 'Precio' asociado a la propiedad
            { model: Precio, as: 'precio' } // Usa 'as' para especificar el alias de la asociación
        ]
    })
    res.render('busqueda', {
        pagina: 'Resultados de la búsqueda', 
        propiedades,
        csrfToken: req.csrfToken()
    })
}

export {
    inicio,
    categoria, 
    noEncontrado,
    buscador
}