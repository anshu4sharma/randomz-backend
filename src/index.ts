import mongoSanitize from "express-mongo-sanitize";
import express from "express";
import cors from "cors";
import UserRoute from "./router/Users";
import AdminRoute from "./router/Admin";
import bodyParser from "body-parser";
import "./db/conn";
import { PORT } from "./constant/env";
import CheckAdminExist from "./utils/preseed";
import { startBullMqWorker } from "./services/bullmq/email-worker";
import { errorHandler } from "./middleware/error.middleware";
import logger from "./logger/winston.logger";
import morganMiddleware from "./logger/morgan.logger";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// preseed data
CheckAdminExist(); // return;

// BULLMQ worker
startBullMqWorker();

// mongodb data sanitization to prevent NoSQL Injection
app.use(mongoSanitize());

app.use(morganMiddleware);

app.use(cors({ origin: "*", credentials: true }));

app.use("/users", UserRoute);

app.use("/admin", AdminRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running at port ${PORT}`);
});
