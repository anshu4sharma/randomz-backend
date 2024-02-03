import nodemailer from "nodemailer";
import { EMAIL, PASSWORD } from "../constant/env";

export const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
    secure: true,
  });