import express from 'express';
import { loginUser, UserRegister,logoutUser,refreshAccessToken } from "../controllers/user.controllers.js"
import { checkEmailExists } from '../middleware/auth/mail.middleware.js';
import { jsonValidator } from '../middleware/auth/json.middleware.js'; 
import { requireAuth } from '../middleware/auth/requireAuth.middleware.js';
const router = express.Router()


router.post("/register",jsonValidator,checkEmailExists, UserRegister);

router.post("/login", jsonValidator,loginUser) ;

router.post("/logout", logoutUser)

router.post("/refreshToken" ,refreshAccessToken)

// ⬇️ NUEVA RUTA PARA FARCASTER
router.post("/farcaster", requireAuth(), async (req, res) => {
  try {
    // El middleware requireAuth ya validó el token de Farcaster
    // y creó/encontró el usuario. req.user ya está disponible.
    
    res.json({
      success: true,
      user: {
        id: req.user.id,
        nombre: req.user.Name,
        rol: req.user.Rol,
        fid: req.user.fid,
        authMethod: req.user.authMethod
      }
    });
  } catch (error) {
    console.error('Error en auth Farcaster:', error);
    res.status(500).json({ message: 'Error al autenticar con Farcaster' });
  }
});

// Ruta /me (ya funciona con ambos métodos)
router.get("/me", requireAuth(["Pastelero", "Admin"]), (req, res) => {
  res.json({
    id: req.user.id,
    nombre: req.user.Name,
    email: req.user.Email || null, // null si es usuario Farcaster
    fid: req.user.fid || null,      // null si es usuario tradicional
    authMethod: req.user.authMethod
  });
});
export default router  