//src/middleware/user/chechExistitReceta.middleware.js
import { dataBase } from "../../config/connectDB.config.js";

// Verificar que el usuario autenticado sea dueño de la receta
export const checkOwnershipReceta = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const receta_id =  req.params?.id || req.body?.receta_id;

    if (!receta_id) {
      return res.status(422).json({ message: "No se recibió receta_id" });
    }

    const query = `
      SELECT 1 FROM recetas
      WHERE id = $1 AND user_id = $2
    `;
    const values = [receta_id, user_id];
    const result = await dataBase.query(query, values);

    if (result.rows.length > 0) {
      return next(); // ✅ El usuario es dueño de la receta
    }

    return res.status(401).json({
      message: "No tenés permisos para modificar esta receta",
    });
  } catch (error) {
    console.error("Error verificando propiedad de la receta:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};
