import crypto from "crypto";

export const Generate_Referal_Id = () => {
  const referralId = crypto.randomBytes(4).toString("hex"); // Generate 8-character hex string
  return referralId;
};
