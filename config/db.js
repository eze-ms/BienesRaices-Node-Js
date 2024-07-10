import { Sequelize } from "sequelize";
import dotenv from 'dotenv';
dotenv.config({path: '.env'})

console.log('DB Config:', process.env.BD_NOMBRE, process.env.BD_USER, process.env.BD_PASS, process.env.BD_HOST, process.env.BD_PORT);

const db = new Sequelize(process.env.BD_NOMBRE, process.env.BD_USER, process.env.BD_PASS ?? '', {
    host: process.env.BD_HOST,
    port: process.env.BD_PORT,
    dialect: 'mysql',
    define: {
        timestamps: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    operatorsAliases: false
});

db.authenticate()
    .then(() => console.log('Conexión correcta a la bbdd'))
    .catch(err => console.error('Error al conectar a la bbdd:', err));

export default db;


// import { Sequelize } from "sequelize";
// import dotenv from 'dotenv';
// dotenv.config({path: '.env'})

// const db = new Sequelize(process.env.BD_NOMBRE, process.env.BD_USER, process.env.BD_PASS ?? '', {
//     host: process.env.BD_HOST,// Dirección del host de la base de datos 
    // port: '3306',// Puerto en el que escucha la base de datos MySQL 
    // dialect: 'mysql', // Dialecto de la base de datos (en este caso, MySQL)
//     define: {
//         timestamps: true // Configuración para definir si se crearán automáticamente columnas de timestamp 'createdAt' y 'updatedAt'
//     },
//     pool: {  // Configuración del pool de conexiones de Sequelize
//         max: 5, // Número máximo de conexiones en el pool
//         min: 0, // Número mínimo de conexiones en el pool
//         acquire: 30000, // Tiempo máximo en milisegundos que Sequelize esperará una conexión disponible
//         idle: 10000 // Tiempo máximo en milisegundos que una conexión puede estar inactiva antes de ser liberada
//     },
//     operatorsAliases: false
// });

// export default db;
