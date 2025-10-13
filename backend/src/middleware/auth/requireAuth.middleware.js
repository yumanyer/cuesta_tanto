import { dataBase } from "../../config/connectDB.config.js";
import { setRefreshToken } from "../../models/user.models.js";
import { verifyToken, generateAccessToken, generateRefreshToken } from "../../config/jwt.config.js";

const isProd = process.env.NODE_ENV === "production";


export const requireAuth = (allowRoles = []) => async (req, res, next) => {
  const token = req.cookies.authToken;
  const refreshToken = req.cookies.refreshToken;

  try {
    if (token) {
      const payload = verifyToken(token);
      req.user = payload;

      if (allowRoles.length && !allowRoles.includes(payload.Rol)) {
        return res.status(403).json({ message: "No estás autorizado" });
      }

      return next();
    }

    // Si no hay token, intentamos refresh
    if (!refreshToken) return res.status(401).json({ message: "No autenticado" });

    const result = await dataBase.query(
      'SELECT id FROM cuesta_tanto.usuarios WHERE refresh_token = $1',
      [refreshToken]
    );
    if (!result.rows.length) return res.status(401).json({ message: "Refresh token inválido" });

    const payload = verifyToken(refreshToken, "refresh");

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await setRefreshToken(payload.id, newRefreshToken);

    res.cookie("authToken", newAccessToken, { 
      httpOnly: true, secure: isProd, sameSite: "strict", maxAge: 60*1000 
    });
    res.cookie("refreshToken", newRefreshToken, { 
      httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 7*24*60*60*1000 
    });

    req.user = payload;
    next();

  } catch (err) {
    console.error("Error en autenticación:", err);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
