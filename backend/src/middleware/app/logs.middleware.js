import { logger } from "../../utils/winstons.utils.js";

export const logRequest = (req, res, next) => {
  const start = Date.now();
  const { method, url, body } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Nivel según status
    let level = "http";
    if (statusCode >= 500) level = "error";
    else if (statusCode >= 400) level = "warn";
    else if (statusCode >= 200 && statusCode < 300) level = "success";
    else if (statusCode >= 300 && statusCode < 400) level = "info";

    const bodyPreview = body && Object.keys(body).length ? JSON.stringify(body) : "";

    logger.log(level, `${method} ${url} ${statusCode} - ${duration}ms${bodyPreview ? " - body: " + bodyPreview : ""}`);
  });

  next();
};
