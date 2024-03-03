import morgan from "morgan";
import logger from "./winston.logger";
import { NODE_ENV } from "../constant/env";

const stream = {
  // Use the http severity
  write: (message: string) => logger.http(message.trim()),
};

const skip = () => {
  const env = NODE_ENV || "development";
  return env !== "development";
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  { stream, skip }
);

export default morganMiddleware;