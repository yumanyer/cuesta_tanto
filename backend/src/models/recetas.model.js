//src/models/recetas.model.js
import {dataBase} from "../config/connectDB.config.js"


export class Recetas{
    constructor(id,user_id,nombre_receta,descripcion,precio_total,created_at){
        this.id=id
        this.user_id=user_id
        this.nombre_receta=nombre_receta
        this.descripcion=descripcion
        this.precio_total=precio_total
        this.created_at=created_at
    }

    async createReceta(user_id,nombre_receta,descripcion,porciones){
        try {
            const query = "INSERT INTO cuesta_tanto.recetas(user_id,nombre_receta,descripcion,precio_total,porciones) VALUES ($1,$2,$3,$4,$5) RETURNING *"   
            //precio total se emepzo a calcular dinamicamente con los ingredientes, por eso lo saco del create
            const values = [user_id,nombre_receta,descripcion,0,porciones]
            console.time("crearReceta")
            const result = await dataBase.query(query,values)
            console.timeEnd("crearReceta")
            return result.rows[0]
        }
         catch (error) {
            console.error("Error creando receta:", error);
            throw error
        }
    }
    async getRecetaUser(user_id){
        try {
            const query=`
            SELECT * FROM cuesta_tanto.recetas
            WHERE user_id=$1 
            ORDER BY ID 
            `
            const values= [user_id]
            console.time("getRecetaUser")
            const result=await dataBase.query(query,values)
            console.timeEnd("getRecetaUser")
            return result.rows
        } catch (error) {
            console.error("Error obteniendo recetas del usuario desarolokooo:", error);
            throw error
        }
    }

    async getRecetaDetail(id) {
    try {
        //INNER JOIN solo aparecen las filas que cumplen la relación en ambas tablas
        //LEFT JOIN garantizás que la receta aparezca siempre, aunque todavía no tenga nada cargado en ingredientes
        const query = `
            SELECT 
                i.id as ingrediente_id,
                i.materia_prima_id,
                r.id as receta_id,
                r.nombre_receta,
                r.descripcion,
                r.precio_total,
                i.unidad as unidad_receta,
                m.nombre_producto,
                m.precio,
                i.cantidad_usada
            FROM cuesta_tanto.recetas AS r
            LEFT JOIN cuesta_tanto.ingredientes AS i
                ON i.receta_id = r.id
            LEFT JOIN cuesta_tanto.materia_prima AS m
                ON m.id = i.materia_prima_id
            WHERE r.id = $1
        `;
        const values = [id];
        const result = await dataBase.query(query, values);
        const rows = result.rows;

        if (rows.length === 0) {
            return { message: "No se encontró la receta" };
        }

        const receta = {
            id: rows[0].receta_id,
            nombre_receta: rows[0].nombre_receta,
            descripcion: rows[0].descripcion,
            precio_total: Number(rows[0].precio_total),
            ingredientes: rows
            // Filtrar filas donde nombre_producto no es null y mapear a formato deseado
                .filter(row => row.nombre_producto !== null)
            // mapear a formato deseado
                .map(row => ({
                    id: row.ingrediente_id,
                    materia_prima_id: row.materia_prima_id,
                    nombre_producto: row.nombre_producto,
                    unidad: row.unidad_receta,
                    precio: row.precio,
                    cantidad_usada: row.cantidad_usada
                }))
        };

        // Si no tiene ingredientes cargados
        if (receta.ingredientes.length === 0) {
            return { ...receta, message: "No hay ingredientes cargados para esta receta" };
        }

        return receta;

    } catch (error) {
        console.error("Error obteniendo detalle de la receta:", error);
        throw error;
    }
    }

    
    async updateReceta(id,nombre_receta,descripcion,porciones){
        try {
            const query=`
            UPDATE cuesta_tanto.recetas
            set nombre_receta=$1,descripcion=$2,porciones=$3
            where id=$4
            RETURNING *
            `
            const values = [nombre_receta, descripcion, porciones, id];
            console.time("updateReceta")
            const result=await dataBase.query(query,values)
            console.timeEnd("updateReceta")
            return result.rows[0]
        } catch (error) {
            console.error("Error actualizando receta:", error);
            throw error
        }
    }
    
    async  deleteReceta(id){
        try {
            const query = `
            DELETE FROM cuesta_tanto.recetas 
            WHERE id = $1
            RETURNING *;
            `;
            const values = [id];
            console.time("deleteReceta")
            const result = await dataBase.query(query, values);
            console.timeEnd("deleteReceta")
            return result.rows[0];
            
        } catch (error) {
            console.error("Error eliminando receta:", error);   
            throw error
        }
    }


}


