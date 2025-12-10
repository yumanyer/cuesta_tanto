import { Errors, createClient } from '@farcaster/quick-auth';
import { dataBase } from "../../config/connectDB.config.js";
import { setRefreshToken } from "../../models/user.models.js";
import { verifyToken, generateAccessToken, generateRefreshToken } from "../../config/jwt.config.js";

const quickAuthClient = createClient();
const isProd = process.env.NODE_ENV === "production";

export const requireAuth = (allowRoles = []) => async (req, res, next) => {
  try {
    let user = null;

    // ==========================================
    // 🔵 1️⃣ Intentar Farcaster desde Authorization header
    // ==========================================
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.split(' ')[1];

      try {
        const payload = await quickAuthClient.verifyJwt({
          token: bearerToken,
          domain: process.env.APP_DOMAIN || 'localhost:3000',
        });

        const fid = payload.sub;

        // Buscar usuario
        let result = await dataBase.query(
          'SELECT * FROM usuarios WHERE fid = $1',
          [fid]
        );

        // Si no existe, crear usuario
        if (!result.rows.length) {
          result = await dataBase.query(
            `INSERT INTO usuarios (fid, "Name", "Rol") 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [fid, `Usuario Farcaster ${fid}`, 'Pastelero']
          );
          console.log(`✅ Nuevo usuario Farcaster creado: ${fid}`);
        }

        user = result.rows[0];

        // Guardar tokens propios en cookie para navegación normal
        const accessToken = generateAccessToken({ id: user.id, Rol: user.Rol });
        const refreshToken = generateRefreshToken({ id: user.id, Rol: user.Rol });
        await setRefreshToken(user.id, refreshToken);

        res.cookie("authToken", accessToken, { httpOnly: true, secure: isProd, sameSite: "strict", maxAge: 60*1000 });
        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 7*24*60*60*1000 });

        user.authMethod = 'farcaster';
      } catch (err) {
        if (!(err instanceof Errors.InvalidTokenError)) {
          console.error('❌ Error Farcaster:', err);
        }
        // Fallthrough al flujo tradicional
      }
    }

    // ==========================================
    // 🟢 2️⃣ Intentar autenticación tradicional (cookie)
    // ==========================================
    if (!user) {
      const token = req.cookies.authToken;
      const refreshToken = req.cookies.refreshToken;

      if (!token && !refreshToken) {
        return res.status(401).json({ message: "No autenticado" });
      }

      if (token) {
        const payload = verifyToken(token);
        user = { ...payload, authMethod: 'traditional' };
      } else if (refreshToken) {
        const result = await dataBase.query(
          'SELECT id FROM usuarios WHERE refresh_token = $1',
          [refreshToken]
        );
        if (!result.rows.length) return res.status(401).json({ message: "Refresh token inválido" });

        const payload = verifyToken(refreshToken, "refresh");

        console.log("🔄 Renovando tokens...");
        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);
        await setRefreshToken(payload.id, newRefreshToken);

        res.cookie("authToken", newAccessToken, { httpOnly: true, secure: isProd, sameSite: "strict", maxAge: 60*1000 });
        res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 7*24*60*60*1000 });

        user = { ...payload, authMethod: 'traditional' };
      }
    }

    // ==========================================
    // 3️⃣ Verificar roles si aplica
    // ==========================================
    if (allowRoles.length && !allowRoles.includes(user.Rol)) {
      return res.status(403).json({ message: "No estás autorizado" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Error en autenticación:", err);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
