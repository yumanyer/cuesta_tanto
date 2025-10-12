import { instanciaIngredientes } from "../models/ingredientes.models.js";
import { normalizarUnidad, getUnidadesValidas } from "../utils/unidades.utils.js";

export async function createIngrediente(req, res) {
  try {
    const { receta_id, materia_prima_id, cantidad_usada, unidad } = req.body;
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ details: "No autorizado" });
    if (!receta_id || !materia_prima_id || !cantidad_usada || !unidad) return res.status(422).json({ details: "Faltan datos obligatorios" });

    const result = normalizarUnidad(unidad, cantidad_usada);
    if (!result) return res.status(422).json({ details: `Unidad no válida. Permitidas: ${getUnidadesValidas().join(", ")}` });
    const { unidadNormalizada, cantidadNormalizada } = result;
    if (isNaN(cantidadNormalizada) || cantidadNormalizada <= 0) return res.status(422).json({ details: "Cantidad usada debe ser >0" });

    const created = await instanciaIngredientes.createIngrediente(user_id, receta_id, materia_prima_id, cantidadNormalizada, unidadNormalizada);
    return res.status(201).json(created);

  } catch (error) {
    console.error("Error createIngrediente:", error);
    if (error.message.includes("Unidad incompatible")) return res.status(422).json({ details: error.message });
    if (error.message.includes("No tenés permisos")) return res.status(403).json({ details: error.message });
    if (error.message.includes("Stock insuficiente")) return res.status(409).json({ details: error.message });
    return res.status(500).json({ details: "Error interno del servidor" });
  }
}

// En el CONTROLLER
export async function bulkCreateIngrediente(req, res) {
  try {
    console.log("1️⃣ Inicio controller - hola");
    const { receta_id, ingredientes } = req.body;
    console.log("2️⃣ Body recibido:", { receta_id, ingredientes });
    
    const user_id = req.user?.id;
    console.log("3️⃣ User ID:", user_id);
    
    if (!user_id) return res.status(401).json({ details: "No autorizado" });
    if (!receta_id || !Array.isArray(ingredientes) || ingredientes.length === 0) {
      console.log("4️⃣ ❌ Validación falló");
      return res.status(422).json({ details: "Debe enviar al menos un ingrediente" });
    }
    
    console.log("5️⃣ Llamando al modelo...");
    const created = await instanciaIngredientes.bulkCreateIngrediente(user_id, receta_id, ingredientes);
    console.log("6️⃣ ✅ Respuesta del modelo:", created);
   
    return res.status(201).json(created);
  } catch (error) {
    console.error("7️⃣ ❌ Error capturado:", error);
    return res.status(400).json({ details: error.message || "Error en la creación de ingredientes" });
  }
}

export async function getIngredientesByRecetaId(req, res) {
    try {
        const receta_id  = Number(req.params.id);
        const user_id = req.user?.id;
        if (!user_id) return res.status(401).json({ details: "No tienes permisos para realizar esta acción" });
        if (!receta_id) return res.status(422).json({ details: "Debe enviar al menos un ingrediente" });

        const ingredientes = await instanciaIngredientes.getIngrediente(user_id, receta_id);
        return res.status(200).json(ingredientes);
    } catch (error) {
        console.error("Error en getIngredientesByRecetaId:", error);
        return res.status(500).json({ details: "Error interno" });
    }
}

export async function modifyIngrediente(req, res) {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { receta_id, materia_prima_id, cantidad_usada, unidad } = req.body;

    if (!id || !receta_id || !materia_prima_id || !cantidad_usada || !unidad) {
      return res.status(422).json({ message: "Todos los campos son obligatorios" });
    }

    const ingredienteModificado = await instanciaIngredientes.modifyIngrediente(
      id, receta_id, materia_prima_id, cantidad_usada, unidad, user_id
    );

    if (!ingredienteModificado) return res.status(404).json({ message: "Ingrediente no encontrado o sin permisos" });

    return res.status(200).json(ingredienteModificado);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// --- Eliminar ingrediente ---
export async function deleteIngrediente(req, res) {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const deletedIngrediente = await instanciaIngredientes.deleteIngrediente(id, user_id);

    if (!deletedIngrediente) return res.status(404).json({ message: "Ingrediente no encontrado o sin permisos" });

    return res.status(200).json({ message: "Ingrediente eliminado correctamente", ingrediente: deletedIngrediente });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}