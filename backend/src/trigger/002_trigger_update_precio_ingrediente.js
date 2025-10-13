// Cuando se actualiza un ingrediente (cantidad_usada o materia_prima_id),
// recalcula el precio_total de la receta correspondiente.

import { dataBase } from "../config/connectDB.config.js";

export async function TriggerActualizarPrecioIngrediente() {
  const query = `
    CREATE OR REPLACE FUNCTION cuesta_tanto.recalcular_precio_por_ingrediente()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'UPDATE' AND
         (NEW.cantidad_usada IS DISTINCT FROM OLD.cantidad_usada
          OR NEW.materia_prima_id IS DISTINCT FROM OLD.materia_prima_id
          OR NEW.receta_id IS DISTINCT FROM OLD.receta_id)
      THEN
        -- recalcula NEW.receta_id
        UPDATE cuesta_tanto.recetas r
        SET precio_total = COALESCE(sub.total, 0)
        FROM (
          SELECT i.receta_id, SUM(i.cantidad_usada * m.precio_unitario) AS total
          FROM cuesta_tanto.ingredientes i
          JOIN cuesta_tanto.materia_prima m ON m.id = i.materia_prima_id
          WHERE i.receta_id = NEW.receta_id
          GROUP BY i.receta_id
        ) sub
        WHERE r.id = sub.receta_id;

        -- si cambió de receta, recalcula OLD.receta_id también
        IF NEW.receta_id IS DISTINCT FROM OLD.receta_id THEN
          UPDATE cuesta_tanto.recetas r
          SET precio_total = COALESCE(sub.total, 0)
          FROM (
            SELECT i.receta_id, SUM(i.cantidad_usada * m.precio_unitario) AS total
            FROM cuesta_tanto.ingredientes i
            JOIN cuesta_tanto.materia_prima m ON m.id = i.materia_prima_id
            WHERE i.receta_id = OLD.receta_id
            GROUP BY i.receta_id
          ) sub
          WHERE r.id = sub.receta_id;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  await dataBase.query(query);
}
