import { dataBase } from "../config/connectDB.config.js";
import { createUser,setRefreshToken } from "../models/user.models.js";
import { verifyPassword } from "../utils/hash.utils.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../config/jwt.config.js";

const isProd = process.env.NODE_ENV === "production";

// Registro de usuario
export async function UserRegister(req, res) {
  try {
    const { Name, Email, Password, Rol } = req.body;
    if (!Name || !Email || !Password)
      return res.status(422).json({ details: "Name, Email y Password son obligatorios." });

    const userRole = Rol || "Pastelero";
    const idUser = await createUser(Name, Email, Password, userRole);
    const payload = { id: idUser, Name, Email, Rol: userRole };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Guardar cookies
    res.cookie("authToken", accessToken, { 
      httpOnly: true, secure: isProd, sameSite: "strict", maxAge:60*1000 
    });
    res.cookie("refreshToken", refreshToken, { 
      httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 7*24*60*60*1000 
    });

      // Guardar refresh token en la DB
      await setRefreshToken(idUser, refreshToken);
      return res.status(201).json({ message: "Usuario registrado con éxito" });
    }
   catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ message: "Error al registrar usuario" });
  }
}


// Login de usuario
export async function loginUser(req, res) {
  const { Email, Password } = req.body;
  if (!Email || !Password)
    return res.status(422).json({ details: "Email y Password son obligatorios" });

  try {
    const result = await dataBase.query(
      'SELECT id, "Email", "Password", "Rol", "Name" FROM usuarios WHERE "Email" = $1',
      [Email]
    );
    if (!result.rows.length) return res.status(401).json({ details: "Usuario o contraseña incorrectos" });

    const user = result.rows[0];
    const isPasswordCorrect = await verifyPassword(Password, user.Password);
    if (!isPasswordCorrect) return res.status(401).json({ details: "Usuario o contraseña incorrectos" });

    const payload = { id: user.id, Name: user.Name, Email: user.Email, Rol: user.Rol };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("authToken", accessToken, { 
      httpOnly: true, secure: isProd, sameSite: "strict", maxAge:60*1000 
    });
    res.cookie("refreshToken", refreshToken, { 
      httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 7*24*60*60*1000 
    });

    await setRefreshToken(user.id,refreshToken)
    

    return res.status(200).json({ message: `Bienvenido Sr. ${user.Name}`, userId: user.id,userEmail:user.Email});
  } catch (error) {
    console.error("Error login:", error);
    return res.status(500).json({ details: "Error al iniciar sesión" });
  }
}

// Logout
// Logout seguro
export async function logoutUser(req, res) {
  try {
    // 1️⃣ Leer cookie de refresh token
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      // Igual limpiamos cookies aunque no haya token
      res.clearCookie("authToken", { httpOnly: true, secure: isProd, sameSite: "strict" });
      res.clearCookie("refreshToken", { httpOnly: true, secure: isProd, sameSite: "lax" });
      return res.status(200).json({ message: "Cierre de sesión exitoso" });
    }

    // 2️⃣ Buscar usuario en la DB por refresh token
    const query = `SELECT id FROM usuarios WHERE refresh_token = $1`;
    const values = [refreshToken];
    const result = await dataBase.query(query, values);

    if (result.rows.length) {
      const userId = result.rows[0].id;

      // 3️⃣ Invalidate refresh token en DB
      await dataBase.query(
        `UPDATE usuarios SET refresh_token = NULL WHERE id = $1`,
        [userId]
      );
    }

    // 4️⃣ Limpiar cookies en el cliente
    res.clearCookie("authToken", { httpOnly: true, secure: isProd, sameSite: "strict" });
    res.clearCookie("refreshToken", { httpOnly: true, secure: isProd, sameSite: "lax" });

    return res.status(200).json({ message: "Cierre de sesión exitoso" });
  } catch (error) {
    console.error("Error logout:", error);
    return res.status(500).json({ message: "Error al cerrar sesión" });
  }
}


// Endpoint para renovar access token
export async function refreshAccessToken(req, res) {

  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No estás autenticado" });

    // 1️⃣ Buscar usuario con este refresh token en la DB
    const query = `SELECT id, "Name", "Email", "Rol", "refresh_token" 
                   FROM usuarios WHERE refresh_token = $1`;
    const values = [token];
    const result = await dataBase.query(query, values);

    if (!result.rows.length) 
      return res.status(401).json({ message: "Refresh token inválido o expirado" });

    const user = result.rows[0];

    // 2️⃣ Verificar JWT del refresh token
    try {
      verifyToken(token, "refresh");
    } catch (err) {
      return res.status(401).json({ message: "Refresh token expirado o inválido" });
    }

    // 3️⃣ Reconstruir payload desde la DB
    const payload = { id: user.id, Name: user.Name, Email: user.Email, Rol: user.Rol };

    // 4️⃣ Generar nuevos tokens
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload); // rotación

    // 5️⃣ Guardar nuevo refresh token en la DB
    await setRefreshToken(user.id, newRefreshToken);

    // 6️⃣ Mandar cookies al cliente
    res.cookie("authToken", newAccessToken, { 
      httpOnly: true, secure: isProd, sameSite: "strict", maxAge: 60*1000 
    });
    res.cookie("refreshToken", newRefreshToken, { 
      httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 7*24*60*60*1000 
    });

    return res.status(200).json({ message: "Access token actualizado" });

  } catch (error) {
    console.error("Error refresh token:", error);
    return res.status(500).json({ message: "Error al procesar refresh token" });
  }
}

