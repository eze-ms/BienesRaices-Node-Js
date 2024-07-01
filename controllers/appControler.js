import { Precio, Categoria, Propiedad } from '../models/index.js'

const inicio = async(req, res) => {

    // Realiza dos consultas a la base de datos en paralelo usando Promise.all
    // Las obtiene en formato crudo (raw)
    const [ categorias, precios ] = await Promise.all([
        Categoria.findAll({ raw: true }), 
        Precio.findAll({raw: true}), 
    ]);
    console.log(categorias);

    res.render('inicio', {
        pagina: 'Inicio',
        categorias,
        precios,
    }) 
}

const categoria = (req, res) => {
    
}

const noEncontrado = (req, res) => {
    
}

const buscador = (req, res) => {
    
}

export {
    inicio,
    categoria, 
    noEncontrado,
    buscador
}