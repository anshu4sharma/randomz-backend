import dotenv from "dotenv";

dotenv.config();

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as any

export const EMAIL = process.env.EMAIL as any

export const PASSWORD = process.env.PASSWORD  as any

export const PORT = process.env.PORT  as any

export const MONGO_URL = process.env.MONGO_URL  as any

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL  as any

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD  as any

