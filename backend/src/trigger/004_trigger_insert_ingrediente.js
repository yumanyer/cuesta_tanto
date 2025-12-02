import { dataBase } from "../config/connectDB.config.js";

// Cuando se inserta un ingrediente, recalcula el precio_total de la receta correspondiente
export async function TriggerInsertarIngrediente() {
  const query = `
    CREATE OR REPLACE FUNCTION recalcular_precio_al_insertar_ingrediente()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE recetas r
        SET precio_total = (
            SELECT COALESCE(SUM(i.cantidad_usada * mp.precio_unitario), 0)
            FROM ingredientes i
            JOIN materia_prima mp ON i.materia_prima_id = mp.id
            WHERE i.receta_id = r.id
        )
        WHERE r.id = NEW.receta_id;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_insertar_ingrediente ON ingredientes;

    CREATE TRIGGER trigger_insertar_ingrediente
    AFTER INSERT ON ingredientes
    FOR EACH ROW
    EXECUTE FUNCTION recalcular_precio_al_insertar_ingrediente();
  `;

  try {
    await dataBase.query(query);
  } catch (err) {
    throw err;
  }
}
