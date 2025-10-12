import {Router} from "express";
import {createIngrediente,bulkCreateIngrediente,getIngredientesByRecetaId,modifyIngrediente,deleteIngrediente} from "../controllers/ingrediente.controllers.js";
import {requireAuth} from "../middleware/auth/requireAuth.middleware.js"
import {checkOwnershipReceta} from "../middleware/user/checkOwnershipReceta.middleware.js"
import {checkOwnershipIngrediente} from "../middleware/user/checkOwnershipIngredientes.middleware.js"
const IngredienteRouter = Router();

IngredienteRouter.post("/create",  requireAuth(["Pastelero","Admin"]),checkOwnershipReceta, createIngrediente);

IngredienteRouter.post("/bulkCreate", requireAuth(["Pastelero","Admin"]), checkOwnershipReceta,bulkCreateIngrediente);

IngredienteRouter.get("/receta/:id",requireAuth(["Pastelero", "Admin"]),checkOwnershipReceta,getIngredientesByRecetaId);

IngredienteRouter.put("/modify/:id", requireAuth(["Pastelero","Admin"]), checkOwnershipIngrediente, modifyIngrediente);

IngredienteRouter.delete("/delete/:id", requireAuth(["Pastelero","Admin"]), checkOwnershipIngrediente, deleteIngrediente);




export default IngredienteRouter;