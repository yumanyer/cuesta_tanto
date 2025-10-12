import jwt from "jsonwebtoken";
import { config } from "./env.config.js";

console.log(config.JWT_SECRET)
console.log(config.JWT_REFRESH_SECRET)

// Genera Access Token (corto plazo)
export function generateAccessToken(payload) {
  try {
    const { iat, exp, ...data } = payload; // quita iat y exp si existen
    return jwt.sign(data, config.JWT_SECRET, { expiresIn: "60s" });
    
  } catch (error) {
    console.error("Error al generar token:", error);
    throw error;
  }
}

// Genera Refresh Token (largo plazo)
export function generateRefreshToken(payload) {
  try{
  const { iat, exp, ...data } = payload; 
  return jwt.sign(data, config.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  } catch (error) {
    console.error("Error al generar token:", error);
    throw error;
  }
}


// Verifica token (access o refresh)
export function verifyToken(token, type = "access") {
  try {
    const secret = type === "refresh" ? config.JWT_REFRESH_SECRET : config.JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    throw error;
  }
}

