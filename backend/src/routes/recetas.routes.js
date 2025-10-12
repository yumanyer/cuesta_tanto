//src/routes/recetas.routes.js
import {Router} from "express";
import {createReceta,getRecetasUser,getRecetaDetail,updateReceta,deleteReceta} from "../controllers/recetas.controllers.js";
import {requireAuth} from "../middleware/auth/requireAuth.middleware.js"
import {checkOwnershipReceta} from "../middleware/user/checkOwnershipReceta.middleware.js"
const RecetasRouter = Router();

// -- crear nueva receta --
RecetasRouter.post("/create", requireAuth(["Pastelero","Admin"]), createReceta);

// -- obtener recetas del usuario --
RecetasRouter.get("/get", requireAuth(["Pastelero","Admin"]), getRecetasUser);
// -- obtener detalle de una receta --
RecetasRouter.get("/detail/:id", requireAuth(["Pastelero","Admin"]),checkOwnershipReceta, getRecetaDetail);
// -- modificar nombre y descripcion receta --
RecetasRouter.put("/update/:id", requireAuth(["Pastelero","Admin"]), checkOwnershipReceta,updateReceta);
// -- eliminar receta --
RecetasRouter.delete("/delete/:id",requireAuth(["Pastelero","Admin"]), checkOwnershipReceta,deleteReceta);


export default RecetasRouter;