//src/middleware/user/checkOwnership.middleware.js
import {  dataBase } from "../../config/connectDB.config.js";
export const checkOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const query = `
      SELECT 1 FROM cuesta_tanto.materia_prima 
      WHERE id = $1 AND user_id = $2
    `;
    const values = [id, user_id];
    const result = await dataBase.query(query, values);

    if (result.rows.length > 0) {
      return next(); // ✅ El producto existe y es del usuario
    }

    //  No se dice si fue porque no existe o no es del usuario
    return res.status(403).json({
      message: "No tenés permisos para acceder a este recurso",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};
