import { z } from "zod";

export const VALIDATE_HANDLE_CLAIM_REQUEST = z.object({
  id: z.string({
    required_error: "ID is Required ",
    invalid_type_error: "ID must be a String",
  }),
  status: z.string({
    required_error: "Status is Required ",
    invalid_type_error: "Status must be a String",
  }),
  transactionId: z.string({
    required_error: "TransactionId is Required ",
    invalid_type_error: "TransactionId must be a String",
  }),
});
export const VALIDATE_FIND_TEAM = z.object({
  id: z.string({
    required_error: "Referral ID is Required ",
    invalid_type_error: "Referral ID must be a String",
  }),
});
