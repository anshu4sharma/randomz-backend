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
