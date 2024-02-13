import mongoose from "mongoose";
import validator from "validator";

const UserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    email: {
      required: false,
      unique: true,
      type: String,
      validate(data: string) {
        if (!validator.isEmail(data)) {
          throw new Error("Email is not valid");
        }
      },
    },
    password: {
      required: false,
      minlength: 5,
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    referedUsers: {
      type: [Object],
      default: [],
    },
    otp: {
      required: false,
      type: Number,
    },
    reward: {
      type: Number,
      default: 0,
    },
    transactionIds: {
      type: [Object],
      default: [],
    },
    referalId: {
      type: String,
      default: "",
    },
    referedBy: {
      type: String,
      default: "",
    },
    rewardedTransactions: {
      type: [Object],
      default: [],
    },
  },
  { timestamps: true }
);

//  here we are creating model / collection
const Users =  mongoose.model("User", UserSchema);

export default Users