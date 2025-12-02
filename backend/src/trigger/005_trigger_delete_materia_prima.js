// Cuando se elimina una materia_prima,
// este trigger recalcula el precio_total de todas las recetas
// que usaban esa materia prima (luego de que se borren sus ingredientes por ON DELETE CASCADE).

import { dataBase } from "../config/connectDB.config.js";

export async function TriggerEliminarMateriaPrima() {
  const query = `
    CREATE OR REPLACE FUNCTION recalcular_precio_al_eliminar_materia()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Recalcular las recetas que tenían ingredientes de esta materia prima eliminada
      UPDATE recetas r
      SET precio_total = COALESCE(sub.total, 0)
      FROM (
        SELECT i.receta_id, SUM(i.cantidad_usada * mp.precio_unitario) AS total
        FROM ingredientes i
        JOIN materia_prima mp ON mp.id = i.materia_prima_id
        GROUP BY i.receta_id
      ) sub
      WHERE r.id = sub.receta_id;

      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_eliminar_materia_prima ON materia_prima;

    CREATE TRIGGER trigger_eliminar_materia_prima
    AFTER DELETE ON materia_prima
    FOR EACH ROW
    EXECUTE FUNCTION recalcular_precio_al_eliminar_materia();
  `;

  try {
    await dataBase.query(query);
  } catch (err) {
    throw err;
  }
}
