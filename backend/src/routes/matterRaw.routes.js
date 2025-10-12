import express from "express";
import { MatterRaw } from "../models/matterRaw.models.js";
import { deleteProdctUser, createProduct, modifyProduct,getAllProductsForUser} from "../controllers/matterRaw.controllers.js";
import { checkOwnership } from "../middleware/user/checkOwnership.middleware.js";
import { requireAuth } from "../middleware/auth/requireAuth.middleware.js";

const MatterRawRouter = express.Router();

// Obtener producto SOLO si es del usuario
 MatterRawRouter.get("/get", requireAuth(["Pastelero","Admin"]), getAllProductsForUser);

// Crear producto
MatterRawRouter.post("/create", requireAuth(["Pastelero","Admin"]), createProduct);

// Modificar producto (solo si es del usuario)
MatterRawRouter.put("/modify/:id", requireAuth(["Pastelero","Admin"]), checkOwnership, modifyProduct);

// Eliminar producto (solo si es del usuario)
MatterRawRouter.delete("/delete/:id", requireAuth(["Pastelero","Admin"]), checkOwnership, deleteProdctUser);

export default MatterRawRouter;
