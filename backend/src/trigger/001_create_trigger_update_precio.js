// Cuando cambias precio_unitario de una materia_prima,


// este trigger recalcula el precio_total de las recetas afectadas.

import { dataBase } from "../config/connectDB.config.js";

export async function TriggerActualizarPrecio() {
  const query = `
    CREATE OR REPLACE FUNCTION cuesta_tanto.recalcular_precio_por_materia()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.precio_unitario IS DISTINCT FROM OLD.precio_unitario THEN
        WITH afectadas AS (
          SELECT DISTINCT receta_id
          FROM cuesta_tanto.ingredientes
          WHERE materia_prima_id = NEW.id
        ),
        totales AS (
          SELECT i.receta_id, SUM(i.cantidad_usada * m.precio_unitario) AS total
          FROM cuesta_tanto.ingredientes i
          JOIN cuesta_tanto.materia_prima m ON m.id = i.materia_prima_id
          WHERE i.receta_id IN (SELECT receta_id FROM afectadas)
          GROUP BY i.receta_id
        )
        UPDATE cuesta_tanto.recetas r
        SET precio_total = COALESCE(totales.total, 0)
        FROM totales
        WHERE r.id = totales.receta_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  await dataBase.query(query);
  console.log("✅ Trigger creado/actualizado: recalcular_precio_por_materia");
}
