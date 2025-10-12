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

router.get("/me",requireAuth(["Pastelero","Admin"]),(req,res)=>{res.json({id:req.user.id,nombre:req.user.Name,email:req.user.Email,})
})
 
export default router  