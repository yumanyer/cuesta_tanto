import { dataBase } from "../config/connectDB.config.js";

// Cuando se inserta un ingrediente, recalcula el precio_total de la receta correspondiente
export async function TriggerInsertarIngrediente() {
  const query = `
    CREATE OR REPLACE FUNCTION cuesta_tanto.recalcular_precio_al_insertar_ingrediente()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE cuesta_tanto.recetas r
        SET precio_total = (
            SELECT COALESCE(SUM(i.cantidad_usada * mp.precio_unitario), 0)
            FROM cuesta_tanto.ingredientes i
            JOIN cuesta_tanto.materia_prima mp ON i.materia_prima_id = mp.id
            WHERE i.receta_id = r.id
        )
        WHERE r.id = NEW.receta_id;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_insertar_ingrediente ON cuesta_tanto.ingredientes;

    CREATE TRIGGER trigger_insertar_ingrediente
    AFTER INSERT ON cuesta_tanto.ingredientes
    FOR EACH ROW
    EXECUTE FUNCTION cuesta_tanto.recalcular_precio_al_insertar_ingrediente();
  `;

  try {
    await dataBase.query(query);
    console.log("✅ Trigger creado/actualizado: insertar ingrediente y recalcular recetas");
  } catch (err) {
    console.error("❌ Error creando trigger insertar ingrediente:", err);
  }
}
