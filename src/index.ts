import mongoSanitize from "express-mongo-sanitize";
import express from "express";
import cors from "cors";
import UserRoute from "./src/router/Users";
import AdminRoute from "./src/router/Admin";
import bodyParser from "body-parser";
import "./src/db/conn";
import { PORT } from "./constant/env";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// To remove data using these defaults:
app.use(mongoSanitize());
app.use(cors({ origin: "*", credentials: true }));

// RewardUser.CHECK_EVERY_FIVE_MINUTES()
app.use("/users", UserRoute);
app.use("/admin", AdminRoute);

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
