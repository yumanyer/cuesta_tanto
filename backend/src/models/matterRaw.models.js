import { dataBase } from "../config/connectDB.config.js";

export class MatterRaw{
    constructor(id,user_id,nombre_producto,stock,unidad,precio,created_at){
        this.id=id
        this.user_id=user_id
        this.nombre_producto=nombre_producto
        this.stock=stock
        this.unidad=unidad
        this.precio=precio
        this.created_at=created_at
    }


async existeProductoForUser(nombre_producto, unidad, user_id, ignore_id = null) {
    try {
        let query = `
            SELECT * FROM materia_prima 
            WHERE nombre_producto = $1 AND unidad = $2 AND user_id = $3
        `;
        const values = [nombre_producto, unidad, user_id];

        if (ignore_id) {
            query += ` AND id != $4`;
            values.push(ignore_id);
        }

        console.time("existeProducto");
        const result = await dataBase.query(query, values);
        console.timeEnd("existeProducto");
        return result.rows.length > 0;
    } catch (error) {
        throw error;
    }
}

    //devolver todos los productos que pertenecen a un usuario específico. 
async getAllProductsForUser(user_id, limit = 5, offset = 0) {
  try {
    let query, values;

    if (limit > 0) {
      query = `
        SELECT * 
        FROM materia_prima 
        WHERE user_id = $1
        ORDER BY id ASC
        LIMIT $2 OFFSET $3
      `;
      values = [user_id, limit, offset];
    } else {
      query = `
        SELECT * 
        FROM materia_prima 
        WHERE user_id = $1
        ORDER BY id ASC
      `;
      values = [user_id];
    }

    const result = await dataBase.query(query, values);
    return { rows: result.rows };
  } catch (error) {
    throw error;
  }
}




//crear nuevo producto en la db
async createProduct(nombre_producto,stock,unidad,precio,user_id,precio_unitario){
        try {
        const query='INSERT INTO materia_prima(nombre_producto,stock,unidad,precio,user_id,precio_unitario) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *'
        const values=[nombre_producto,stock,unidad,precio,user_id,precio_unitario]
        console.time("createProduct")
        const result=await dataBase.query(query,values)
        console.timeEnd("createProduct")
        return result.rows[0]
        } catch (error) {
            throw error
        }
    
}

async modifyProduct(nombre_producto, stock, unidad, precio, id, user_id, precio_unitario) {
    try {
        const query = `
            UPDATE materia_prima
            SET nombre_producto = $3,
                stock = $4,
                unidad = $5,
                precio = $6,
                precio_unitario = $7
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        const values = [id, user_id, nombre_producto, stock, unidad, precio, precio_unitario];
        console.time("modifyProduct");
        const result = await dataBase.query(query, values);
        console.timeEnd("modifyProduct");
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}


    async deleteProduct(id,user_id){
        try {
            const query = 'DELETE from  materia_prima where id = $1 and user_id = $2 RETURNING * '
            const values = [id,user_id]
            console.time("deleteProduct")
            const result = await dataBase.query(query,values)
            console.timeEnd("deleteProduct")
            return result
        } catch (error) {
            throw error
        }
    }
}    