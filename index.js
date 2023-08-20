const mongoSanitize = require("express-mongo-sanitize");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const UserRoute = require("./src/router/Users");
const bodyParser = require("body-parser");
require("./src/db/conn");
dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// To remove data using these defaults:
app.use(mongoSanitize());
app.use(cors({ origin: "*", credentials: true }));
const RewardUser  = require("./src/cronjob/Rewards")
 
// RewardUser.CHECK_EVERY_FIVE_MINUTES()
app.use("/users", UserRoute);
app.listen(process.env.PORT, () => {
  console.log(`Server is running at port ${process.env.PORT}`);
});
