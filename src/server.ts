import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { dot } from "node:test/reporters";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));
app.use(routes);
app.use(errorHandler);

export { app };
