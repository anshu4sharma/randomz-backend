import Users from "../model/UserSchema";
import Transaction from "../model/Transaction";
import ClaimRequests from "../model/ClaimRequests";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Generate_Referal_Id } from "../utils/Users";
import { Request, Response } from "express";
import { JWT_ACCESS_SECRET } from "../constant/env";
import { saltround } from "../constant";
import {
  VALIDATE_ADD_TRANSACTION,
  VALIDATE_CLAIM_REQUEST,
  VALIDATE_LOGIN,
  VALIDATE_SEND_EMAIL,
  VALIDATE_SIGNUP,
  VALIDATE_VERIFY_RESET_PASSWORD_OTP,
} from "../zod-schema/User.schema";
import { enqueueEmail } from "../services/bullmq/email-queue";
import { asyncHandler } from "../utils/AsyncHandler";
import ApiError from "../utils/ApiError";

export interface CustomRequest extends Request {
  id?: string; // Assuming id is a string
}

export default class UserController {
  static sendEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = VALIDATE_SEND_EMAIL.parse(req.body);
    const otp = Math.floor(Math.random() * 9000 + 1000);
    let user = {
      email,
      otp,
      referalId: Generate_Referal_Id(),
    };
    const mailData = {
      to: email,
      subject: "Verifcation code",
      text: "",
      html: `<span>Your Verification code is ${otp}</span>`,
    };
    let IsEmail = await Users.findOne({ email: email });
    if (IsEmail) {
      throw new ApiError(403, "Account already Exists !");
    } else {
      let userInfo = new Users(user);
      await userInfo.save();
      enqueueEmail(mailData);
      return res.json({ message: "Otp has been sent successfully !" });
    }
  });

  static signup = asyncHandler(async (req: Request, res: Response) => {
    let { email, password, referedBy, otp } = VALIDATE_SIGNUP.parse(req.body);
    let IsValid = await Users.findOne({
      $and: [{ email: email }, { otp: otp }],
    });

    if (IsValid) {
      if (IsValid.isVerified) {
        throw new ApiError(200, "Already Verified !");
      }
      let salt = await bcrypt.genSalt(saltround);
      let hash_password = await bcrypt.hash(password, salt);

      let updatedDetails = {
        isVerified: true,
        password: hash_password,
        referedBy: "",
      };

      if (referedBy) {
        let referedByUser = await Users.findOne({ referalId: referedBy });
        if (!referedByUser) {
          throw new ApiError(403, "Invalid referal Id");
        }
        updatedDetails.referedBy = referedBy;
      }
      await Users.findOneAndUpdate({ email: email }, updatedDetails, {
        returnOriginal: false,
      });
      return res
        .status(200)
        .json({ message: "You are now successfully verified" });
    } else {
      throw new ApiError(401, "Wrong Otp !");
    }
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = VALIDATE_LOGIN.parse(req.body);
    let IsValidme = await Users.findOne({ email: email });
    if (!IsValidme) {
      throw new ApiError(403, "Invalid credential");
    } else {
      if (IsValidme.isVerified) {
        let data = {
          id: IsValidme.id,
          name: IsValidme.email,
        };
        let isMatch = await bcrypt.compare(
          password,
          IsValidme.password as string
        );
        if (isMatch) {
          let authToken = jwt.sign({ data }, JWT_ACCESS_SECRET, {
            expiresIn: "10day",
          });
          return res.status(200).json({ authToken });
        } else {
          throw new ApiError(403, "Invalid credential");
        }
      } else {
        return res.status(401).json({
          message: "Please verify your email address",
        });
      }
    }
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = VALIDATE_SEND_EMAIL.parse(req.body);
    const otp = Math.floor(Math.random() * 9000 + 1000);
    const mailData = {
      to: email,
      subject: "Verifcation code for password reset",
      text: "",
      html: `<span>Your Verification code is ${otp}</span>`,
    };
    const user = await Users.findOne({ email });
    if (!user) {
      throw new ApiError(403, "User with this email does not exist");
    } else {
      user.otp = otp;
      await user.save();
      enqueueEmail(mailData);
      return res.json({ message: "Otp has been sent successfully !" });
    }
  });

  static verify_Reset_Password_Otp = asyncHandler(
    async (req: Request, res: Response) => {
      const { email, password, otp } = VALIDATE_VERIFY_RESET_PASSWORD_OTP.parse(
        req.body
      );
      let salt = await bcrypt.genSalt(saltround);
      let hash_password = await bcrypt.hash(password, salt);
      let IsValid = await Users.findOne({
        $and: [{ email: email }, { otp: otp }],
      });
      if (IsValid) {
        await Users.findOneAndUpdate(
          { email: email },
          { password: hash_password },
          {
            returnOriginal: false,
          }
        );
        res
          .status(200)
          .json({ message: "You password have been changed successfully !" });
      } else {
        throw new ApiError(401, "Wrong Otp !");
      }
    }
  );
  
  // TODO: need to work on it ! ( reward system maybe need to add cron job )
  static addTransaction = asyncHandler(
    async (req: CustomRequest, res: Response) => {
      const { account, txid, amount } = VALIDATE_ADD_TRANSACTION.parse(req.body)
      const user = await Users.findById(req.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      await Transaction.create({
        account,
        txid,
        amount,
        user: user._id,
      });
      res.status(200).json({ message: "Transaction successfull !" });
    }
  );

  static GET_TOTAL_PURCHASE_AMOUNT = asyncHandler(
    async (req: CustomRequest, res: Response) => {
      const user = await Users.findById(req.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const pipeline = [
        {
          $match: {
            user: user._id,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
          },
        },
      ];
      const results = await Transaction.aggregate(pipeline);
      if (results.length === 0) {
        return res.json({ total: 0 });
      }
      const total = results[0].total;
      res.status(200).json({ total });
    }
  );

  static GET_TOTAL_PURCHASE_OF_ALL_USERS = asyncHandler(
    async (req: Request, res: Response) => {
      const pipeline = [
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ];
      const results = await Transaction.aggregate(pipeline);
      if (results.length === 0) {
        return res.status(200).json({ total: 0 });
      }
      const total = results[0].total;
      res.status(200).json({ total });
    }
  );

  static CLAIM_REQUEST = asyncHandler(
    async (req: CustomRequest, res: Response) => {
      const userId = req.id;
      const { amount } = VALIDATE_CLAIM_REQUEST.parse(req.body);
      const user = await Users.findById(userId);
      if (!amount || !user) {
        throw new ApiError(400, "Please fill all the fields");
      }

      const claimRequests = await ClaimRequests.find({
        email: user?.email,
        status: "pending", // Filtering by status 'pending'
      });

      if (claimRequests.length > 0) {
        throw new ApiError(201, "Pending claim requests found");
      } else {
        if (user.reward < amount) {
          // console.log(user.reward);
          // console.log("Insufficient reward");
          throw new ApiError(400, "Insufficient reward");
        }
        await ClaimRequests.create({
          email: user.email,
          amount,
          status: "pending",
        });

        return res
          .status(200)
          .json({ message: "Claim request added successfully" });
      }
    }
  );

  static GET_ALL_TRANSACTIONS = asyncHandler(
    async (req: CustomRequest, res: Response) => {
      const user = await Users.findById(req.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const skip = (page - 1) * perPage;

      const transactions = await Transaction.find({
        user: user._id,
      })
        .skip(skip)
        .limit(perPage);

      const totalCount = await Transaction.countDocuments({
        user: user._id,
      });

      res.status(200).json({
        transactions,
        page,
        perPage,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      });
    }
  );

  static GET_REFFERAL_ID = asyncHandler(
    async (req: CustomRequest, res: Response) => {
      const user = await Users.findById(req.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
     return res.status(200).json({ referalId: user.referalId, reward: user.reward });
    }
  );

  static GET_CLAIM_REQUESTS = asyncHandler(
    async (req: CustomRequest, res: Response) => {
      const page = parseInt(req.query.page as string) || 1;
      const UserId = req.id;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const user = await Users.findById(UserId);
      const skip = (page - 1) * perPage;

      // check if user exists or not !
      if (!user) {
        return res.status(200).json({
          claimRequests: [],
          page,
          perPage,
          totalRecords: 0,
          totalPages: 0,
        });
      }
      // Query the database with pagination
      const results = await ClaimRequests.find({ email: user?.email })
        .skip(skip)
        .limit(perPage);

      // Get the total count of records for pagination calculation
      const totalCount = await ClaimRequests.countDocuments({
        email: user?.email,
      });

      res.status(200).json({
        claimRequests: results,
        page,
        perPage,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      });
    }
  );
}
