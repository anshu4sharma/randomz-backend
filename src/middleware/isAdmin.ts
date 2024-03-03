import jwt from "jsonwebtoken";
import Users from "../model/UserSchema";
import { JWT_ACCESS_SECRET } from "../constant/env";
import { NextFunction, Response, Request } from "express";

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = String(req.headers["auth-token"]);
  try {
    if (!token) {
      return res.status(401).send("Access denied");
    }
    jwt.verify(
      token,
      JWT_ACCESS_SECRET,
      async function (_error: any, { data }: any) {
        const user = await Users.findById(data.id);
        if (user !== null && user.role !== "admin") {
          return res.status(401).send("Access denied");
        }
        next();
      }
    );
  } catch (error) {
    res.status(401).send("Access denied");
  }
};

export default isAdmin;
