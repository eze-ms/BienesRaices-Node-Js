import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js"; // Asegúrate de importar el modelo específico

const identificarUsuario = async (req, res, next) => {
  // Identificar si hay un token
  const { _token } = req.cookies;

  if (!_token) {
    req.usuario = null;
    return next();
  }

  // Comprobar el token
  try {
    const decoded = jwt.verify(_token, process.env.JWT_SECRET);
    const usuario = await Usuario.scope('eliminarPassword').findByPk(decoded.id);

    if (!usuario) {
      req.usuario = null;
      return res.clearCookie('_token').redirect('/auth/login');
    }

    // Almacenar el usuario en req
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error al verificar el token:', error);
    req.usuario = null;
    return res.clearCookie('_token').redirect('/auth/login');
  }
};

export default identificarUsuario;
