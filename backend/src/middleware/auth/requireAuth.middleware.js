import { Errors, createClient } from '@farcaster/quick-auth';
import { dataBase } from "../../config/connectDB.config.js";
import { setRefreshToken } from "../../models/user.models.js";
import { verifyToken, generateAccessToken, generateRefreshToken } from "../../config/jwt.config.js";

const quickAuthClient = createClient();
const isProd = process.env.NODE_ENV === "production";

export const requireAuth = (allowRoles = []) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // ==========================================
  // 🔵 MÉTODO 1: Autenticación con Farcaster
  // ==========================================
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.split(' ')[1];
    
    try {
      const payload = await quickAuthClient.verifyJwt({
        token: bearerToken,
        domain: process.env.APP_DOMAIN || 'localhost:3000',
      });
      
      const fid = payload.sub;
      
      // Buscar usuario por FID
      let userResult = await dataBase.query(
        'SELECT * FROM usuarios WHERE fid = $1',
        [fid]
      );
      
      // Si no existe, crear usuario automáticamente
      if (!userResult.rows.length) {
        userResult = await dataBase.query(
          `INSERT INTO usuarios (fid, "Name", "Rol") 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [fid, `Usuario Farcaster ${fid}`, 'Pastelero']
        );
        console.log(`✅ Nuevo usuario creado con FID: ${fid}`);
      }
      
      const user = userResult.rows[0];
      
      req.user = {
        id: user.id,
        fid: user.fid,
        Name: user.Name,
        Rol: user.Rol,
        authMethod: 'farcaster' // Para debugging
      };
      
      // Verificar roles
      if (allowRoles.length && !allowRoles.includes(req.user.Rol)) {
        return res.status(403).json({ message: "No estás autorizado" });
      }
      
      console.log('✅ Auth Farcaster exitoso:', req.user.fid);
      return next();
      
    } catch (e) {
      if (e instanceof Errors.InvalidTokenError) {
        console.info('⚠️ Token de Farcaster inválido, probando método tradicional...');
        // Continuar al siguiente método
      } else {
        console.error('❌ Error de autenticación Farcaster:', e);
        // Continuar al siguiente método
      }
    }
  }
  
  // ==========================================
  // 🟢 MÉTODO 2: Autenticación Tradicional (Cookies)
  // ===  =======================================
  const token = req.cookies.authToken;
  const refreshToken = req.cookies.refreshToken;

  try {
    if (token) {
      const payload = verifyToken(token);
      req.user = {
        ...payload,
        authMethod: 'traditional' // Para debugging
      };

      if (allowRoles.length && !allowRoles.includes(payload.Rol)) {
        return res.status(403).json({ message: "No estás autorizado" });
      }

      console.log('✅ Auth tradicional exitoso:', req.user.id);
      return next();
    }

    // Si no hay token, intentamos refresh
    if (!refreshToken) {
      console.log('❌ No hay tokens disponibles');
      return res.status(401).json({ message: "No autenticado" });
    }

    const result = await dataBase.query(
      'SELECT id FROM usuarios WHERE refresh_token = $1',
      [refreshToken]
    );
    
    if (!result.rows.length) {
      return res.status(401).json({ message: "Refresh token inválido" });
    }

    const payload = verifyToken(refreshToken, "refresh");

    console.log("🔄 Renovando tokens...");
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await setRefreshToken(payload.id, newRefreshToken);

    res.cookie("authToken", newAccessToken, { 
      httpOnly: true, secure: isProd, sameSite: "strict", maxAge: 60*1000 
    });
    res.cookie("refreshToken", newRefreshToken, { 
      httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 7*24*60*60*1000 
    });

    req.user = {
      ...payload,
      authMethod: 'traditional'
    };
    
    console.log('✅ Tokens renovados exitosamente');
    next();

  } catch (err) {
    console.error("❌ Error en autenticación:", err);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};