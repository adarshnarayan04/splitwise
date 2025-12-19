import express from "express";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(routes);
app.use(errorHandler);

export { app };
