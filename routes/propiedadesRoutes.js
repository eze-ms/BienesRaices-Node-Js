import express from "express"
import { body } from "express-validator"
import { admin, crear, guardar, agregarImagen, almacenarImagen } from '../controllers/propiedadController.js'
import protegerRuta from "../middelware/protegerRuta.js"
import upload from "../middelware/subirImagen.js"

const router = express.Router()

router.get('/mis-propiedades', protegerRuta, admin)
router.get('/propiedades/crear', protegerRuta, crear)
router.post('/propiedades/crear',
    protegerRuta,
    body('titulo').notEmpty().withMessage('El titulo del anuncio es obligatorio'),
    body('descripcion')
        .notEmpty()
        .withMessage('La descripción no puede estar vacía')
        .isLength({ max: 200 }).withMessage('La descripción es demasiado larga'),
    body('categoria').isNumeric().withMessage('Debes seleccionar una categoría'),
    body('precio').isNumeric().withMessage('Selecciona un rango de precios'),
    body('habitaciones').isNumeric().withMessage('Selecciona la cantidad de habitaciones'),
    body('parking').isNumeric().withMessage('Selecciona un número de plazas de parking'),
    body('wc').isNumeric().withMessage('Selecciona la cantidad de baños'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardar
)

router.get('/propiedades/agregar-imagen/:id', 
    protegerRuta,
    agregarImagen
)

router.post('/propiedades/agregar-imagen/:id',
    protegerRuta,
    upload.single('imagen'),
    almacenarImagen
)
 
export default router