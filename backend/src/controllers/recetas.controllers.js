    //src/controllers/recetas.controllers.js
    import { Recetas } from "../models/recetas.model.js";

    const instanciaRecetas = new Recetas();

    // --- CREAR RECETA ---
    export async function createReceta(req, res) {
        try {
            // Desestructuramos del body
            const { nombre_receta, descripcion, porciones } = req.body;

            // Limpiar y convertir
            const nombre = nombre_receta?.trim();
            const desc = descripcion?.trim();
            
            

            // Verificar que el usuario esté autenticado
            const user_id = req.user?.id;
            if (!user_id) {
                return res.status(401).json({ details: "No tienes permisos para realizar esta acción" });
            }

            // Validaciones
            if (!nombre || nombre.length < 3 || nombre.length > 50) {
                return res.status(422).json({ details: "El nombre de la receta debe tener entre 3 y 50 caracteres" });
            }
            if (!desc || desc.length < 3 || desc.length > 500) {
                return res.status(422).json({ details: "La descripción de la receta debe tener entre 3 y 500 caracteres" });
            }

            if (isNaN(porciones) || porciones < 0) {
                return res.status(422).json({ details: "La cantidad de porciones debe ser un número positivo" });
            }

            // Crear receta
            //precio_total se inicializa en 0 y se actualizará al agregar ingredientes
            const receta = await instanciaRecetas.createReceta(user_id, nombre, desc, porciones) ;

            // Devolver resultado
            return res.status(201).json(receta);
        } catch (error) {
            console.error("Error al crear la receta:", error);
            return res.status(500).json({ message: "Error al crear la receta" });
        }
    }

    // -- Obtener recetas del usuario--
    export async function getRecetasUser(req,res){
        try {
            const user_id = req.user.id
            if (!user_id) return res.status(401).json({ details: "No tienes permisos para realizar esta acción" });
            const recetas = await instanciaRecetas.getRecetaUser(user_id)
            return res.status(200).json({message:"Recetas obtenidas correctamente",recetas:recetas})

            
        } catch (error) {
            console.error("Error al obtener recetas del usuario:", error);
            return res.status(500).json({ message: "Error al obtener recetas del usuario" });
        }
    }

    // -- Obtener detalle de una receta --
    export async function getRecetaDetail(req, res) {
        try {
            const id = req.params.id;
            if (!id) {
                return res.status(400).json({ message: "NO se indico que receta se quiere obtener" }); 
            }
            const receta = await instanciaRecetas.getRecetaDetail(id);

            if (!receta) {
                return res.status(404).json({ message: "Receta no encontrada" });
            }

            return res.status(200).json(receta);
        } catch (error) {
            console.error("Error al obtener detalle de la receta:", error);
            return res.status(500).json({ message: "Error al obtener detalle de la receta" });
        }
    }

    // -- modificar nombre y descripcion receta --
    export async function updateReceta(req,res){
        try {
            const id = req.params.id
            const { nombre_receta, descripcion ,porciones} = req.body
            if (!id) return res.status(400).json({ message: "NO se indico que receta se quiere actualizar" });
            if (!nombre_receta || !descripcion) return res.status(400).json({ message: "NO se indico que propiedad se quiere actualizar" });
                
            const receta = await instanciaRecetas.updateReceta(id,nombre_receta,descripcion,porciones)
            return res.status(200).json(receta)
        } catch (error) {
            console.error("Error al actualizar la receta:", error);
            return res.status(500).json({ message: "Error al actualizar la receta" });
        }
    }

    // -- eliminar receta --
export async function deleteReceta(req,res){
    try {
        const id = req.params.id
        const user_id = req.user.id
        
        if (!id) return res.status(400).json({ message: "NO se indico que receta se quiere eliminar" });
        if (!user_id) return res.status(401).json({ details: "No tienes permisos para realizar esta acción" });
        
        //if(!receta) return res.status(404).json({ message: "Receta no encontrada o ya eliminada" });
        

        const receta = await instanciaRecetas.deleteReceta(id)
        return res.status(200).json({ message: "Receta eliminada correctamente", receta })
    } catch (error) {
        console.error("Error al eliminar la receta:", error);
        return res.status(500).json({ message: "Error al eliminar la receta" });
    }
}