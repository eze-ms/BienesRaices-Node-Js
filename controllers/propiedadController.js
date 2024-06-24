import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad } from '../models/index.js'
import { log } from 'node:console';

const admin = async (req, res) => {
    const { id } = req.usuario;

    const propiedades = await Propiedad.findAll({
        where: {
            usuarioId: id 
        },
        //Tabla relacionada
        include: [
            { model: Categoria, as: 'categoria' },
            { model: Precio, as: 'precio' }
        ]
    })

    res.render('propiedades/admin', {
        pagina: 'Mis propiedades',
        propiedades,
        csrfToken: req.csrfToken(),
    })
};

//Formulario para crear nueva propiedad
const crear = async(req, res) => {
    //Consultar modelo de precios y categorías
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(), 
        categorias,
        precios,
        datos: {}
    })
};

const guardar = async(req, res) => {
     //Validación 
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {

        //Consultar modelo de precios y categorías
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),  
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    // Crear un registro
    const { titulo, descripcion, habitaciones, parking, wc, calle, lat, lng, precio, categoria  } = req.body
    
    const { id: usuarioId } = req.usuario

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            parking,
            wc,
            calle,
            lat,
            lng,
            precioId: precio,
            categoriaId: categoria,
            usuarioId,
            imagen: ''
        })

        const { id } = propiedadGuardada
        res.redirect(`/propiedades/agregar-imagen/${id}`)

    } catch (error) {
        console.log(error);
    }
};

const agregarImagen = async(req, res) => {

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad no esté publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad pertenece a quién visita la página
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
        return res.redirect('/mis-propiedades')
    }
   
    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar imagen de : ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
};

const almacenarImagen = async (req, res, next) => {

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad no esté publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad pertenece a quién visita la página
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
        return res.redirect('/mis-propiedades')
    }
    
    try {
        // console.log(req.file);
        
        // Almacenar la imagen y publicar propiedad
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1

        await propiedad.save()

        res.redirect('/mis-propiedades') // Redirige a mis-propiedades

    } catch (error) {
        console.log(error);
        res.redirect('/mis-propiedades') // Redirige a mis-propiedades en caso de error
    }
};

const editar = async (req, res) => {

    const { id } = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    //Consultar modelo de precios y categorías
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(), 
        categorias,
        precios,
        datos: propiedad
    })
}

const guardarCambios = async (req, res) => {

    //Verificar la validación 
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {

        //Consultar modelo de precios y categorías
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(), 
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    const { id } = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    // Reescribir el objeto y actualizarlo
    try {

        // Crear un registro
        const { titulo, descripcion, habitaciones, parking, wc, calle, lat, lng, precio, categoria  } = req.body

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            parking,
            wc,
            calle,
            lat,
            lng,
            precioId: precio,
            categoriaId: categoria
        })
        await propiedad.save();
        res.redirect('/mis-propiedades')
        
    } catch (error) {
        console.log(error);
    }
}

const eliminar = async (req, res) => {
    const { id } = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    // Eliminar la imagen 
    await unlink(`public/uploads/${propiedad.imagen}`)
    console.log(`Se eliminó la imagen...${propiedad.imagen}`);

    //Eliminar la propiedad
    await propiedad.destroy()
    res.redirect('/mis-propiedades')
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar
}