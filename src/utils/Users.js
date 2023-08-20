const crypto = require("crypto");
const Users = require("../model/UserSchema");
module.exports = class UserUtity {
  static Generate_Referal_Id = () => {
    const referralId = crypto.randomBytes(4).toString("hex"); // Generate 8-character hex string
    return referralId;
  };
//   static isAlready_Verified = async (email) => {
//     const user = await Users.findOne({ email });
//     console.log(user.isVerified, "isVerified");
//     return user.isVerified;
//   };
};
