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
    otp: {
      required: false,
      type: Number,
      default: null,
    },
    reward: {
      type: Number,
      default: 0,
    },
    referalId: {
      type: String,
      default: "",
    },
    referedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

//  here we are creating model / collection
const Users = mongoose.model("User", UserSchema);

export default Users;
