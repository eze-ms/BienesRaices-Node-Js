import { DataTypes } from 'sequelize'
import bcrypt from 'bcrypt'
import db from '../config/db.js'

const Usuario = db.define('usuarios', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: DataTypes.STRING,
    confirmado: DataTypes.BOOLEAN
    
}, {
    hooks: { 
        // Intercepta el password y lo hashea
        beforeCreate: async function (usuario) {
            const salt= await bcrypt.genSalt(10)
            usuario.password = await bcrypt.hash( usuario.password, salt ); 
        }
    },
    // Los scopes permiten eliminar ciertos campos cuando haces una consulta a un modelo en específico
    scopes: {
        eliminarPassword: {
            attributes: {
                exclude: ['password', 'token', 'createdAt', 'updatedAt' ] // Excluye los campos al usar este scope
            }
        }
    }
})

// Métodos Personalizados
Usuario.prototype.verificarPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

export default Usuario