import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js';

const admin = async (req, res) => {
    // Leer Querystring para obtener la página actual
    const { pagina: paginaActual } = req.query
    
    // Expresión regular para validar el número de página
    const expresion = /^[1-9]$/

    // Si la página no es válida, redirigir a la primera página
    if (!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const { id } = req.usuario;

        // Definir límite y offset para la paginación
        const limit = 5
        const offset = ((paginaActual * limit) - limit)

        // Consultar propiedades del usuario paginadas, incluyendo categorías y precios
        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit: limit,
                offset,
                where: {
                    usuarioId: id 
                },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' }
                ],
            }),
            Propiedad.count({
                where: {
                    usuarioId: id
                }
            })
        ])
        

        // Renderizar la vista 'propiedades/admin' con los datos obtenidos
        res.render('propiedades/admin', {
            pagina: 'Mis propiedades',
            propiedades,
            total,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total, 
            offset,
            limit
        })

    } catch (error) {
        console.log(error);
    }
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

// Muestra una propiedad
const mostrarPropiedad = async (req, res) => {

    const {id } = req.params 

    //Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include : [
            {model: Precio, as: 'precio'},
            {model: Categoria, as: 'categoria'}
        ]
    })

    if(!propiedad) {
        return res.redirect('/404')
    }

    res.render('propiedades/mostrar', {
        propiedad, 
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    })
}

const enviarMensaje = async (req, res) => {

    const {id } = req.params 

    //Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include : [
            {model: Precio, as: 'precio'},
            {model: Categoria, as: 'categoria'}
        ]
    })

    if(!propiedad) {
        return res.redirect('/404')
    }

    // Renderizar los errores si los hay
     //Validación 
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            propiedad, 
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })
    }
    const { mensaje } = req.body
    const { id: propiedadId } = req.params
    const { id: usuarioId } = req.usuario

    // Almacenar mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })

    res.render('propiedades/mostrar', {
        propiedad, 
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        enviado: true
    })
}

// Leer Mensajes recibidos
const verMensaje = async (req, res) => {
    const { id } = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes', 
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
            }
        ],
    })

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    mostrarPropiedad,
    enviarMensaje,
    verMensaje,
    formatearFecha
}