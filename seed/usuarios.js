import bcrypt from 'bcrypt'

const usuarios = [
    {
        nombre: 'Ezequiel',
        email: 'ezequiel@ezequiel.com',
        confirmado: 1,
        password: bcrypt.hashSync('password', 10)
    }
]

export default usuarios