import dotenv from "dotenv";

dotenv.config();

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as any

export const EMAIL = process.env.EMAIL as any

export const PASSWORD = process.env.PASSWORD  as any

export const PORT = process.env.PORT  as any

export const MONGO_URL = process.env.MONGO_URL  as any

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL  as any

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD  as any

export const EMAIL_FROM = process.env.EMAIL_FROM  as any

export const REDIS_HOST = process.env.REDIS_HOST  as any

export const REDIS_PORT = process.env.REDIS_PORT as any

export const SMTP_PORT = process.env.SMTP_PORT  as any

export const SMTP_HOST = process.env.SMTP_HOST  as any

export const SMTP_SECURE = process.env.SMTP_SECURE  as any

export const SMTP_PROVIDER = process.env.SMTP_PROVIDER  as any

