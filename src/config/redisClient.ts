import IORedis from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "../constant/env";
import logger from "../logger/winston.logger";

const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

// @ts-ignore
const redisClient = new IORedis(redisOptions, {
  maxRetriesPerRequest: null as number | null, // Explicitly define the type
});

export default redisClient;

redisClient.on("ready", () => {
  logger.info("Redis is connected !");
});

// Define a function to handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  try {
    // Disconnect from the MongoDB database
    await redisClient.disconnect();
    console.log("Disconnected from the redis");
    console.log(`Received ${signal}. Exiting gracefully.`);
    process.exit(0); // Successful exit
  } catch (error) {
   logger.error(
      "Error occurred while disconnecting from the database:",
      error
    );
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
};

const signals = ["SIGTERM", "SIGINT", "SIGQUIT"];

signals.map((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});
