import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET } from "../constant/env";
import { Request,Response , NextFunction } from "express";

const authUser = (req:Request, res:Response, next:NextFunction) => {
  const token = req.headers["auth-token"];
  try {
    if (!token) {
      return res.status(401).send("Access denied");
    }
    const { data } = jwt.verify(token, JWT_ACCESS_SECRET);
    req.id = data.id;
    next();
  } catch (error) {
    res.status(401).send(error);
  }
};

export default authUser;
