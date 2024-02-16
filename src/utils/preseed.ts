import { saltround } from "../constant";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../constant/env";
import Users from "../model/UserSchema";
import { Generate_Referal_Id } from "./Users";
import bcrypt from 'bcrypt'
const CheckAdminExist = async () => {
  try {
    const isAdminExist = await Users.findOne({ role: "admin" });
    if (!isAdminExist) {
      let salt = await bcrypt.genSalt(saltround);
      let hash_password = await bcrypt.hash(ADMIN_PASSWORD, salt);
      Users.create({
        email: ADMIN_EMAIL,
        password: hash_password,
        role: "admin",
        isVerified: true,
        referalId:Generate_Referal_Id()
      });
      console.log("Admin User Created !!");
      return;
    }
    console.log("Admin User Already Exist !");
    return;
  } catch (error) {
    throw error;
  }
};

export default CheckAdminExist;
