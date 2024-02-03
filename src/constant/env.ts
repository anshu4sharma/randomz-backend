import dotenv from "dotenv";
import { GetPublicKeyOrSecret, Secret } from "jsonwebtoken";

dotenv.config();

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as Secret | GetPublicKeyOrSecret

export const EMAIL = process.env.EMAIL

export const PASSWORD = process.env.PASSWORD 

export const PORT = process.env.PORT 

export const MONGO_URL = process.env.MONGO_URL 

