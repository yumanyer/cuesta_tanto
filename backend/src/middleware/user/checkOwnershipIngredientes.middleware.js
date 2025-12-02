import { dataBase } from "../../config/connectDB.config.js";

export const checkOwnershipIngrediente = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const ingrediente_id = req.params.id;

    // Buscar receta asociada al ingrediente
    const result = await dataBase.query(
      "SELECT receta_id FROM ingredientes WHERE id = $1",
      [ingrediente_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Ingrediente no encontrado" });

    const receta_id = result.rows[0].receta_id;

    // Verificar que el usuario sea dueño de la receta
    const recetaPropietario = await dataBase.query(
      "SELECT 1 FROM recetas WHERE id = $1 AND user_id = $2",
      [receta_id, user_id]
    );

    if (recetaPropietario.rows.length === 0)
      return res.status(401).json({ message: "No tenés permisos para modificar esta receta" });

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
