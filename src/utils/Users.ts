import crypto from "crypto";
import { Response } from "express";
import { ZodError } from "zod";
export const Generate_Referal_Id = () => {
  const referralId = crypto.randomBytes(4).toString("hex"); // Generate 8-character hex string
  return referralId;
};

export function sendZodError(res: Response, error: ZodError): void {
  res.status(400).json({
    message: "Validation failed",
    errors: error.errors.map((err) => err.message),
  });
}