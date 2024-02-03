import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Users from "../model/UserSchema";
import { JWT_ACCESS_SECRET } from "../constant/env";


const isAdmin = async (req, res, next) => {
  const token = req.headers["auth-token"];
  try {
    if (!token) {
      return res.status(401).send("Access denied");
    }
    const { data } = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await Users.findById(data._id);
    if (user.role !== "admin") {
      return res.status(401).send("Access denied");
    }
    next();
  } catch (error) {
    res.status(401).send("Access denied");
  }
};

export default isAdmin;
