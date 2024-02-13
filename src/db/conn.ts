import mongoose from "mongoose";
import { MONGO_URL } from "../constant/env";

mongoose
.connect(MONGO_URL, {
  // @ts-ignore
  useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => {
    console.log(err, "Database Connection Failed");
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
    console.error("Error occurred while disconnecting from the database:", error);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
};

// Listen for the SIGTERM signal and perform graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Listen for the SIGINT (Ctrl+C) signal and perform graceful shutdown
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Listen for the SIGQUIT signal and perform graceful shutdown
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));