import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET } from "../constant/env";
import { Response, NextFunction } from "express";
import { CustomRequest } from "../controller/User";

const authUser = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.headers["auth-token"];
  try {
    if (!token) {
      return res.status(401).send("Access denied");
    }
    // @ts-ignore
    const { data } = jwt.verify(token, JWT_ACCESS_SECRET);
    req.id = data.id;
    next();
  } catch (error) {
    res.status(401).send(error);
  }
};

export default authUser;
