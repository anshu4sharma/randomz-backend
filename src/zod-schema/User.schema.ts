import { z } from "zod";

export const VALIDATE_SEND_EMAIL = z.object({
  email: z.string({required_error:"Email is Required"}).email({ message: "Enter a Valid Email ID" }),
});

export const VALIDATE_SIGNUP = z.object({
  email: z.string().email({ message: "Email is Required" }),
  password: z
    .string({ required_error: "Password is Required" })
    .min(5, { message: "Min 5 char. is Required for Password" }),
  referedBy: z.string().optional(),
  otp: z.number({
    required_error: "Otp is Required",
    invalid_type_error: "Otp must be a Number",
    coerce: true,
  }),
});

export const VALIDATE_LOGIN = z.object({
  email: z.string().email({ message: "Email is Required" }),
  password: z
    .string({ required_error: "Password is Required" })
    .min(5, { message: "Min 5 char. is Required for Password" }),
});
export const VALIDATE_VERIFY_RESET_PASSWORD_OTP = z.object({
  email: z.string().email({ message: "Email is Required" }),
  password: z
  .string({ required_error: "Password is Required" })
  .min(5, { message: "Min 5 char. is Required for Password" }),
  otp: z.number({
    required_error: "Otp is Required",
    invalid_type_error: "Otp must be a Number",
    coerce: true,
  }),
});

export const VALIDATE_CLAIM_REQUEST = z.object({
  amount: z.number({
    required_error:"Amount is Required ",
    invalid_type_error:"Amount must be a Number"
  }),
});

