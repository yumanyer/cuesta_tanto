//IMPORTS
import express from "express"
import path from "path"
import cookieParser from "cookie-parser"
//DB
import { dataBase } from "./config/connectDB.config.js"
//VARIABLES
import {config} from "./config/env.config.js"
//TRIGGERS
import {TriggerActualizarPrecio} from "./trigger/001_create_trigger_update_precio.js"
import {TriggerActualizarPrecioIngrediente} from "./trigger/002_trigger_update_precio_ingrediente.js"
import {TriggerDeleteIngrediente} from "./trigger/003_trigger_delete_ingrediente.js"
import {TriggerInsertarIngrediente} from "./trigger/004_trigger_insert_ingrediente.js"
import {TriggerEliminarMateriaPrima} from "./trigger/005_trigger_delete_materia_prima.js"

//RUTAS
import userRoutes from "./routes/user.routes.js"
import matterRouter from "./routes/matterRaw.routes.js"
import RecetasRouter from "./routes/recetas.routes.js"
import IngredienteRouter from "./routes/ingrediente.routes.js"
// DIRNAME => OBTIENE LA RUTA DEL DIRECTORIO 
import getDirname from "../dirname.js"
//MIDDLEWARE
import { logRequest } from "./middleware/app/logs.middleware.js"
import { requireAuth } from "./middleware/auth/requireAuth.middleware.js"
// CONFIG SERVER
const app = express()
const PORT = process.env.PORT || config.port || 3000
const privatePath = path.join(getDirname(), '../frontend/private')
const publicPath = path.join(getDirname(), '../frontend/public')
app.use(express.static(path.join(getDirname(), 'public')));

// config de winston
app.use(logRequest)

// config de express
app.use(express.json() )
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
// CONFIG DE FRONT 
app.use(express.static(publicPath))


 // CONEXION A LA postgreSQL
dataBase.query("SELECT NOW()")
.then(()=>{
    console.time("Conexión a la base de datos")
    InitApp()
    console.timeEnd("Conexión a la base de datos")
})
.catch((error)=>{
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
})
 
async function InitApp(){
    try {

        await TriggerActualizarPrecio() //001
        await TriggerActualizarPrecioIngrediente() //002
        await TriggerDeleteIngrediente() //003
        await TriggerInsertarIngrediente() //004
        await TriggerEliminarMateriaPrima() //005
        
        app.use("/api/users",userRoutes)
        app.use("/api/matterRaw",matterRouter)
        app.use("/api/recetas", RecetasRouter)
        app.use("/api/ingrediente", IngredienteRouter)
        // Servir manifest de Farcaster
        app.get('/.well-known/farcaster.json', (req, res) => {
          res.json({
              "accountAssociation": {
                "header": "eyJmaWQiOjE1Njk0MTgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg4RmRhODVCMDdlZWZEMjRFZmE1QmRkM2FkQTUzMzM5YmQwMzkxOTFFIn0",
                "payload": "eyJkb21haW4iOiJjdWVzdGEtdGFudG8ub25yZW5kZXIuY29tIn0",
                "signature": "eb4zzlvWdcoyGtT7FM9mlf1yvQG3CuUzYoTIDxIxC30+5id86+J2SnDZFM8Tohu5assfKMytuZy7O2ey3GC8Lxs="
              }
            ,
            "frame": {
              "version": "1",
              "name": "Cuanto Cuesta",
              "iconUrl": "https://cuesta-tanto.onrender.com/icon.png",
              "homeUrl": "https://cuesta-tanto.onrender.com",
              "imageUrl": "https://cuesta-tanto.onrender.com/splash.png",
              "buttonTitle": "Calcular Costos",
              "splashImageUrl": "https://cuesta-tanto.onrender.com/splash.png",
              "splashBackgroundColor": "#1a1a1a",
              "webhookUrl": "https://cuesta-tanto.onrender.com/api/farcaster/webhook"
            }
          });
        });

        //protego la ruta de cargar materia separando logica de interfaz
        app.get("/matterRaw", requireAuth(["Pastelero","Admin"]), (req,res)=>{
            res.sendFile(path.join(privatePath,"/matterRaw.html"))
        })

        app.get("/ingredientes", requireAuth(["Pastelero","Admin"]), (req,res)=>{
            res.sendFile(path.join(privatePath,"/ingredientes.html"))
        }) 

        app.get("/recetas",requireAuth(["Pastelero","Admin"]),(req,res)=>{
            res.sendFile(path.join(privatePath,"/recetas.html"))
        })

        app.get("/",(req,res)=>{
            res.sendFile(path.join(publicPath,"home.html"))
        })


         // UNA VEZ CONECTADA LA DB INICIO LA APP
         //2-3 ms
         console.time("Inicio de la aplicación")
            app.listen(config.port, () => {
                console.log("Server on port", config.port)
            })
        console.timeEnd("Inicio de la aplicación")
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
        process.exit(1);
    }
}