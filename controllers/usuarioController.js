import { check, validationResult } from 'express-validator';
import bcrypt from "bcrypt";
import Usuario from '../models/Usuario.js';
import { generarJWT, generarId } from '../helpers/tokens.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js';

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    });
};

const autenticar = async (req, res) => {
    // Validación
    await check('email').isEmail().withMessage('El email es obligatorio').run(req);
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req);

    const resultado = validationResult(req);

    // Verificar que el resultado de la validación esté vacío
    if (!resultado.isEmpty()) {
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    const { email, password } = req.body;

    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no existe' }],
        });
    }

    // Comprobar si el usuario está confirmado
    if(!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu cuenta no ha sido confirmada' }],
        });
    }

    // Verificar la contraseña
    if (!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El password es incorrecto' }]
        });
    }

    // Autenticar usuario
   const token = generarJWT({ id: usuario.id, nombre: usuario.nombre })
   console.log(token);

   // Almacenar en un cookie
    return res.cookie('_token', token, {
        httpOnly: true
        // secure: true,
        // sameSite: true
    }).redirect('/mis-propiedades')
};

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
    
};

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        usuario: {},
        email: {},
        csrfToken: req.csrfToken()
    });
};

const registrar = async (req, res) => {
    // Validación
    await check('nombre').notEmpty().withMessage('El nombre no puede estar vacío').run(req);
    await check('email').isEmail().withMessage('Eso no parece un email válido').run(req);
    await check('password').isLength({ min: 6 }).withMessage('El password debe de ser de al menos 6 caracteres').run(req);
    await check('repetir_password').equals(req.body.password).withMessage('El password no es el mismo').run(req);

    // Revisar el resultado de la validación
    const resultado = validationResult(req);

    // Verificar que el usuario esté vacío
    if (!resultado.isEmpty()) {
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });
    }

    // Extraer datos
    const { nombre, email, password } = req.body;

    // Verificar que el usuario no esté duplicado
    const existeUsuario = await Usuario.findOne({ where: { email } });
    if (existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario ya está registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });
    }

    // Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    });

    // Enviar email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    });

    // Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un email de confirmación, presiona en el enlace'
    });
};

// Función que comprueba una cuenta
const confirmar = async (req, res) => {
    const { token } = req.params;

    // Verificar si el token es válido
    const usuario = await Usuario.findOne({ where: { token } });

    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, inténtalo de nuevo más tarde',
            error: true
        });
    }

    // Confirmar la cuenta: el token se invalida y la cuenta se marca como confirmada
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmó correctamente',
        error: false
    });
};

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recuperar acceso',
        csrfToken: req.csrfToken(),
    });
};

const resetPassword = async (req, res) => {
    await check('email').isEmail().withMessage('Eso no parece un email válido').run(req);

    // Revisar el resultado de la validación
    const resultado = validationResult(req);

    // Verificar que el usuario esté vacío
    if (!resultado.isEmpty()) {
        return res.render('auth/olvide-password', {
            pagina: 'Recuperar acceso',
            csrfToken: req.csrfToken(), 
            errores: resultado.array()
        });
    }

    // Lógica para restablecer la contraseña
    //Buscar el usuario
    const { email } = req.body
    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario)
        return res.render('auth/olvide-password', {
            pagina: 'Recuperar acceso',
            csrfToken: req.csrfToken(), 
            errores: [{msg:"El email no pertenece a ningún usuario"}]
        });

    //Generar un token y enviar un email
    usuario.token = generarId();
    await usuario.save();

    //Enviar email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    });
    //Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Restablece tu password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    });
};

const comprobarToken = async (req,res) => {
    const { token } = req.params;
    const usuario = await Usuario.findOne({where: {token}});
    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Restablece tu password',
            mensaje: 'Hubo un error al validar tu información, inténtalo de nuevo más tarde',
            error: true
        });
    }

    // Mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Restablece tu password',
        csrfToken: req.csrfToken()
    })
};

const nuevoPassword =async(req,res) => {
    //Validar
    await check('password').isLength({ min: 6 }).withMessage('El password debe de ser de al menos 6 caracteres').run(req);
    const resultado = validationResult(req);

    // Verificar que el usuario esté vacío
    if (!resultado.isEmpty()) {
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }
    const { token } = req.params
    const { password } = req.body;

    //Identificar
    const usuario = await Usuario.findOne({where: {token}})
    
    //Hasherar
    const salt= await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt); 
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password restablecido',
        mensaje: 'El password se guardó correctamente'
    })
}; 

export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
};
