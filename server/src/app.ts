import express, { type Express } from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { requestLogger } from "./lib/logger.js";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestLogger);

app.use("/api", routes);

export default app;
