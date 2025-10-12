// backend/src/config/logger.js
import winston from "winston";
import path from "path";

const { combine, timestamp, printf, colorize } = winston.format;

// Definimos niveles personalizados, incluyendo 'success'
const levels = {
  error: 0,
  warn: 1,
  success: 2,
  info: 3,
  http: 4,
  verbose: 5,
  debug: 6,
};

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  success: 'green',
  info: 'magenta',
  http: 'blue',
  verbose: 'cyan',
  debug: 'white',
};

winston.addColors(colors);

// Formato personalizado
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Creamos el logger
export const logger = winston.createLogger({
  levels,
  level: 'debug', // nivel mínimo a mostrar
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    colorize({ all: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join("logs", "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join("logs", "combined.log") })
  ],
});

