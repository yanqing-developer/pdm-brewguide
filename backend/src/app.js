import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/notfound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
