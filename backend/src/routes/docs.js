import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "../config/env.js";
import { swaggerSpec } from "../config/swagger.js";

const router = Router();

if (env.apiDocsEnabled) {
  router.use("/docs", swaggerUi.serve);
  router.get("/docs", swaggerUi.setup(swaggerSpec));
  router.get("/openapi.json", (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
}

export default router;
