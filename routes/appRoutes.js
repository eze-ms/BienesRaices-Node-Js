import express from 'express'
import { categoria, inicio, noEncontrado, buscador } from '../controllers/appControler.js'

const router = express.Router()

//Página de inicio
router.get('/', inicio)

//Categorías
router.get('/categorias/:id', categoria)

//Página 404
router.get('/404', noEncontrado)

//Buscador
router.post('/buscador', buscador)

export default router;