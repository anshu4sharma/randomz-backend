import mongoose from "mongoose";
import { MONGO_URL } from "../constant/env";
import logger from "../logger/winston.logger";

mongoose
.connect(MONGO_URL, {
  // @ts-ignore
  useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    logger.info("Database Connected Successfully");
  })
  .catch((err) => {
    logger.error(err, "Database Connection Failed");
  });

// Define a function to handle graceful shutdown
const gracefulShutdown = async (signal:string) => {
  try {
    // Disconnect from the MongoDB database
    await mongoose.disconnect();
    console.log("Disconnected from the database");
    console.log(`Received ${signal}. Exiting gracefully.`);
    process.exit(0); // Successful exit
  } catch (error) {
    logger.error("Error occurred while disconnecting from the database:", error);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
};

const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'];

signals.map(signal => {
  process.on(signal, () => gracefulShutdown(signal));
});
