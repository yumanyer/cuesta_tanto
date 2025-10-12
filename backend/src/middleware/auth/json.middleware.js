
export function jsonValidator(req,res,next){
      if (!req.is("application/json")) {
    return res.status(400).json({
      details: "El formato de la petición no es válido. Por favor, verifica que sea correcto."
    });
  }
  next();
}