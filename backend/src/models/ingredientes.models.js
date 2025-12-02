import { dataBase } from "../config/connectDB.config.js";
import { normalizarUnidad, getUnidadesValidas } from "../utils/unidades.utils.js";

export class Ingredientes {
  constructor(id, user_id, receta_id, materia_prima_id, cantidad_usada, unidad, created_at) {
    this.id = id;
    this.user_id = user_id;
    this.receta_id = receta_id;
    this.materia_prima_id = materia_prima_id;
    this.cantidad_usada = cantidad_usada;
    this.unidad = unidad;
    this.created_at = created_at;
  }

  // --- Función interna de validación ---
  async _validarStockYUnidad(client, user_id, materia_prima_id, cantidadNormalizada, unidadNormalizada) {
    const { rows: materiaRows } = await client.query(
      `SELECT stock, unidad,nombre_producto,id FROM materia_prima WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [materia_prima_id, user_id]
    );
    if (materiaRows.length === 0) throw new Error("No tenés permisos sobre esta materia prima");

    const idMateria = materiaRows[0].id;
    const unidadBase = materiaRows[0].unidad;
    const nombre_producto = materiaRows[0].nombre_producto;
    const compatibles = { "Gramos": ["Gramos", "Kilo"], "Mililitro": ["Mililitro", "Litro"], "Individual": ["Individual"] };
    if (!compatibles[unidadBase]?.includes(unidadNormalizada)) {
      throw new Error(`Unidad incompatible. La materia prima ${nombre_producto}  con ID ${idMateria} se cargó como '${unidadBase}'`);
    }

    if (materiaRows[0].stock < cantidadNormalizada) throw new Error(`Stock insuficiente de ${nombre_producto}, Disponible: ${materiaRows[0].stock}`);

    return materiaRows[0].stock;
  }

  // --- Crear o sumar un ingrediente ---
  async createIngrediente(user_id, receta_id, materia_prima_id, cantidad_usada, unidad) {
    const result = normalizarUnidad(unidad, cantidad_usada);
    if (!result) throw new Error(`Unidad no válida. Permitidas: ${getUnidadesValidas().join(", ")}`);
    const { unidadNormalizada, cantidadNormalizada } = result;

    const client = await dataBase.connect();
    try {
      await client.query("BEGIN");

      // Validaciones y stock
      await this._validarStockYUnidad(client, user_id, materia_prima_id, cantidadNormalizada, unidadNormalizada);

      // Verificar duplicados
      const { rows: ingredienteRows } = await client.query(
        `SELECT id, cantidad_usada FROM ingredientes
         WHERE receta_id=$1 AND materia_prima_id=$2 AND user_id=$3 FOR UPDATE`,
        [receta_id, materia_prima_id, user_id]
      );

      let ingredienteCreado;
      let stockARestar = cantidadNormalizada;

      if (ingredienteRows.length > 0) {
        const newCantidad = Number(ingredienteRows[0].cantidad_usada) + cantidadNormalizada;

        // Ajustar stock correctamente solo por la diferencia
        stockARestar = newCantidad - ingredienteRows[0].cantidad_usada;

        const { rows } = await client.query(
          `UPDATE ingredientes SET cantidad_usada=$1 WHERE id=$2 RETURNING *`,
          [newCantidad, ingredienteRows[0].id]
        );
        ingredienteCreado = rows[0];
      } else {
        const { rows } = await client.query(
          `INSERT INTO ingredientes (user_id, receta_id, materia_prima_id, cantidad_usada, unidad)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [user_id, receta_id, materia_prima_id, cantidadNormalizada, unidadNormalizada]
        );
        ingredienteCreado = rows[0];
      }

      // Actualizar stock
      await client.query(
        `UPDATE materia_prima SET stock = stock - $1 WHERE id=$2`,
        [stockARestar, materia_prima_id]
      );

      // Actualizar precio_total de la receta
      const { rows: precioRows } = await client.query(
        `SELECT SUM(i.cantidad_usada * mp.precio_unitario) AS precio_total
         FROM ingredientes i
         JOIN materia_prima mp ON i.materia_prima_id = mp.id
         WHERE i.receta_id=$1 AND i.user_id=$2`,
        [receta_id, user_id]
      );

      const precio_total = parseFloat(precioRows[0]?.precio_total || 0).toFixed(2);

      await client.query(
        `UPDATE recetas SET precio_total=$1 WHERE id=$2 AND user_id=$3`,
        [precio_total, receta_id, user_id]
      );

      await client.query("COMMIT");
      return { ...ingredienteCreado, cantidad_usada: Number(ingredienteCreado.cantidad_usada), precio_total };

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // --- Bulk create / merge ---
async bulkCreateIngrediente(user_id, receta_id, ingredientes) {
  const client = await dataBase.connect();
  let ingredienteArray = typeof ingredientes === "string" ? JSON.parse(ingredientes) : ingredientes;

  try {
    await client.query("BEGIN");

    const map = new Map();
    for (const ing of ingredienteArray) {
      const result = normalizarUnidad(ing.unidad, ing.cantidad_usada);
      if (!result) throw new Error(`Unidad no válida para materia prima ${ing.materia_prima_id}. Permitidas: ${getUnidadesValidas().join(", ")}`);
      let { unidadNormalizada, cantidadNormalizada } = result;

      if (cantidadNormalizada <= 0) throw new Error(`Cantidad inválida para ${ing.materia_prima_id}`);
      if (unidadNormalizada === "Individual" && !Number.isInteger(cantidadNormalizada)) throw new Error(`Individual solo acepta enteros.`);

      // Combinar duplicados en el mismo array
      if (map.has(ing.materia_prima_id)) {
        map.get(ing.materia_prima_id).cantidad_usada += cantidadNormalizada;
      } else {
        map.set(ing.materia_prima_id, { ...ing, unidad: unidadNormalizada, cantidad_usada: cantidadNormalizada });
      }
    }

    const ingredientesMapeados = [...map.values()];

    // Traer existentes en esa receta
    const { rows: existentes } = await client.query(
      `SELECT id, materia_prima_id, cantidad_usada 
       FROM ingredientes 
       WHERE receta_id=$1 AND user_id=$2`,
      [receta_id, user_id]
    );

    const actualizados = [];
    const nuevos = [];

    for (const ing of ingredientesMapeados) {
      const existe = existentes.find(e => e.materia_prima_id === ing.materia_prima_id);

      // Validación y stock
      const stockActual = await this._validarStockYUnidad(
        client, user_id, ing.materia_prima_id, ing.cantidad_usada, ing.unidad
      );

      if (stockActual < ing.cantidad_usada) {
        throw new Error(`Stock insuficiente para ${ing.materia_prima_id}. Disponible: ${stockActual}`);
      }

      // Siempre descontamos lo nuevo
      await client.query(
        `UPDATE materia_prima SET stock=stock-$1 WHERE id=$2`,
        [ing.cantidad_usada, ing.materia_prima_id]
      );

      if (existe) {
        // SUMAR la nueva cantidad a la existente
        const { rows } = await client.query(
          `UPDATE ingredientes 
           SET cantidad_usada = cantidad_usada + $1 
           WHERE id=$2 RETURNING *`,
          [ing.cantidad_usada, existe.id]
        );
        actualizados.push(rows[0]);
      } else {
        nuevos.push(ing);
      }
    }

    // Insertar nuevos ingredientes
    let insertados = [];
    if (nuevos.length > 0) {
      const values = [];
      const placeholders = [];
      nuevos.forEach((ing, i) => {
        const start = i * 5 + 1;
        placeholders.push(`($${start},$${start+1},$${start+2},$${start+3},$${start+4})`);
        values.push(user_id, receta_id, ing.materia_prima_id, ing.cantidad_usada, ing.unidad);
      });

      const { rows } = await client.query(
        `INSERT INTO ingredientes (user_id, receta_id, materia_prima_id, cantidad_usada, unidad)
         VALUES ${placeholders.join(", ")} RETURNING *`,
        values
      );
      insertados = rows;
    }

    // Actualizar precio_total
    const { rows: precioRows } = await client.query(
      `SELECT SUM(i.cantidad_usada * mp.precio_unitario) AS precio_total
       FROM ingredientes i
       JOIN materia_prima mp ON i.materia_prima_id = mp.id
       WHERE i.receta_id=$1 AND i.user_id=$2`,
      [receta_id, user_id]
    );

    const precio_total = parseFloat(precioRows[0]?.precio_total || 0).toFixed(2);
    await client.query(
      `UPDATE recetas SET precio_total=$1 WHERE id=$2 AND user_id=$3`,
      [precio_total, receta_id, user_id]
    );

    await client.query("COMMIT");
    return { ingredientes: [...actualizados, ...insertados], precio_total };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


  async getIngrediente(user_id, receta_id) {
    const query = `SELECT * FROM ingredientes WHERE user_id=$1 AND receta_id=$2 ORDER BY id`;
    const values = [user_id, receta_id];
    const result = await dataBase.query(query, values);
    return result.rows;
  }

  async modifyIngrediente(id, receta_id, materia_prima_id, cantidad_usada, unidad, user_id) {
    const query = `
      UPDATE ingredientes
      SET receta_id = $1,
          materia_prima_id = $2,
          cantidad_usada = $3,
          unidad = $4
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `;
    const values = [receta_id, materia_prima_id, cantidad_usada, unidad, id, user_id];
    const result = await dataBase.query(query, values);
    return result.rows[0];
  }

  async deleteIngrediente(id, user_id) {
    const query = `DELETE FROM ingredientes WHERE id = $1 AND user_id = $2 RETURNING *`;
    const values = [id, user_id];
    const result = await dataBase.query(query, values);
    return result.rows[0];
  }
}

export const instanciaIngredientes = new Ingredientes();

            /**SUM() en SQL ya usa todos los ingredientes que quedaron en la DB para esa receta */
            /**
             * Map funciona como un diccionario ordenado.
            * .has() → pregunta si ya existe la clave.
            * .get() → obtiene el valor existente para modificarlo.
            * .set() → inserta o reemplaza el valor.
            * Esto en tu modelo permite que un bulkCreate no duplique ingredientes 
            * y que la cantidad total de cada materia prima se acumule correctamente.
             */