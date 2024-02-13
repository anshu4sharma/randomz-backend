import { NextFunction, Response } from "express";
import { CustomRequest } from "../controller/User";

const reqId = async (req:CustomRequest, res:Response, next:NextFunction) => {
  const token = req.params.id;
  try {
    if (!token) {
      return res.status(401).send("Access denied");
    }
    req.id = token;
    next();
  } catch (error) {
    res.status(401).send("Access denied");
  }
};

export default reqId;
