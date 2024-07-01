import express from 'express'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'

//Crear app
const app = express()

//Habilitar lectura datos del formulario 
app.use( express.urlencoded({extended: true}) )

//Habilitar Cookie Parser
app.use( cookieParser() )

//Habilitar CSRF
app.use ( csurf({cookie: true}) )

//Conexión a la bbdd
try {
    await db.authenticate();
    db.sync()//sync crea la tabla
    console.log('Conexión correcta a la bbdd');
} catch (error) {
    console.log(error);
}

//Habilitar PUG
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta Pública
app.use( express.static('public') )

//Routing
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)



// Definir un puerto y arrancar el proyecto
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`El servidor está funcionando en el puerto: ${port}`);
})
