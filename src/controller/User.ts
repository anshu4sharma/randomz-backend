import Users from "../model/UserSchema";
import Transaction from "../model/Transaction";
import ClaimRequests from "../model/ClaimRequests";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Generate_Referal_Id, sendZodError } from "../utils/Users";
import { Request, Response } from "express";
import { JWT_ACCESS_SECRET } from "../constant/env";
import { saltround } from "../constant";
import { ZodError } from "zod";
import {
  VALIDATE_CLAIM_REQUEST,
  VALIDATE_LOGIN,
  VALIDATE_SEND_EMAIL,
  VALIDATE_SIGNUP,
  VALIDATE_VERIFY_RESET_PASSWORD_OTP,
} from "../zod-schema/User.schema";
import { enqueueEmail } from "../services/bullmq/email-queue";

export interface CustomRequest extends Request {
  id?: string; // Assuming id is a string
}

export default class UserController {
  static sendEmail = async (req: Request, res: Response) => {
    try {
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
        return res.status(403).json({ message: "Account already exists" });
      } else {
        let userInfo = new Users(user);
        await userInfo.save();
        enqueueEmail(mailData);
        res.json({ message: "Otp has been sent successfully !" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle Zod validation error
        sendZodError(res, error);
      } else {
        console.error(error);
        res.status(500).json({ message: "Failed to send OTP" });
      }
    }
  };

  static signup = async (req: Request, res: Response) => {
    try {
      let { email, password, referedBy, otp } = VALIDATE_SIGNUP.parse(req.body);
      let IsValid = await Users.findOne({
        $and: [{ email: email }, { otp: otp }],
      });

      if (IsValid) {
        if (IsValid.isVerified) {
          return res.status(200).json({
            message: "Already Verified !",
          });
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
            return res.status(403).json({
              message: "Invalid referal Id",
            });
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
        return res.status(401).json({ message: "Wrong Otp !" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        sendZodError(res, error);
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = VALIDATE_LOGIN.parse(req.body);
      let IsValidme = await Users.findOne({ email: email });
      if (!IsValidme) {
        return res.status(403).json({ message: "Invalid credential" });
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
            return res.status(403).json({ message: "Invalid credential" });
          }
        } else {
          return res.status(401).json({
            message: "Please verify your email address",
          });
        }
      }
    } catch (error) {
      if (error instanceof ZodError) {
        sendZodError(res, error);
      } else {
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };
  static resetPassword = async (req: Request, res: Response) => {
    try {
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
        return res.status(403).json({
          message: "User with this email does not exist",
        });
      } else {
        user.otp = otp;
        await user.save();
        enqueueEmail(mailData);
        return res.json({ message: "Otp has been sent successfully !" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        sendZodError(res, error);
      } else {
        res.status(500).json({ message: error });
      }
    }
  };
  static verify_Reset_Password_Otp = async (req: Request, res: Response) => {
    try {
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
        res.status(401).json({ message: "Wrong Otp !" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        sendZodError(res, error);
      } else {
        res.status(500).json({ message: error });
      }
    }
  };
  // TODO: not used anywhere

  static fetch_User_details = async (req: CustomRequest, res: Response) => {
    try {
      const user = await Users.findById(req.id);
      res.status(200).json({ user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  // TODO: not used anywhere

  static GET_ALL_USERS = async (req: CustomRequest, res: Response) => {
    try {
      const users = await Users.find({ role: "user" }).select("-password");
      res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  // TODO: not used anywhere
  static BLOCK_USER_ACCOUNT = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.isBlocked = true;
      await user.save();
      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  // TODO: need to work on it ! ( reward system maybe need to add cron job )
  static addTransaction = async (req: CustomRequest, res: Response) => {
    try {
      const { account, txid, amount } = req.body;
      if (!account || !txid || !amount) {
        return res.status(403).json({ error: "Please fill all the fields" });
      }
      const user = await Users.findById(req.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await Transaction.create({
        account,
        txid,
        amount,
        user: user._id,
      });
      res.status(200).json({ message: "Transaction successfull !" });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Error in adding transaction", error });
    }
  };
  // TODO: fixed
  static GET_TOTAL_PURCHASE_AMOUNT = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      const user = await Users.findById(req.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
    } catch (error) {
      console.error("Error fetching total:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  // TODO: fixed
  static GET_TOTAL_PURCHASE_OF_ALL_USERS = async (
    req: Request,
    res: Response
  ) => {
    try {
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
    } catch (error) {
      console.error("Error fetching total:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  // TODO: fixed
  static CLAIM_REQUEST = async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.id;
      const { amount } = VALIDATE_CLAIM_REQUEST.parse(req.body);
      const user = await Users.findById(userId);
      if (!amount || !user) {
        console.log("Please fill all the fields");
        return res.status(400).json({ message: "Please fill all the fields" });
      }

      const claimRequests = await ClaimRequests.find({
        email: user?.email,
        status: "pending", // Filtering by status 'pending'
      });

      if (claimRequests.length > 0) {
        return res
          .status(201)
          .json({ message: "Pending claim requests found" });
      } else {
        if (user.reward < amount) {
          console.log(user.reward);
          console.log("Insufficient reward");
          return res.status(400).json({ message: "Insufficient reward" });
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
    } catch (error) {
      if (error instanceof ZodError) {
        sendZodError(res, error);
      } else {
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };
  // TODO: fixed
  static GET_ALL_TRANSACTIONS = async (req: CustomRequest, res: Response) => {
    try {
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
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  // TODO: fixed
  static GET_REFFERAL_ID = async (req: CustomRequest, res: Response) => {
    try {
      const user = await Users.findById(req.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ referalId: user.referalId, reward: user.reward });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  // TODO: fixed
  static GET_CLAIM_REQUESTS = async (req: CustomRequest, res: Response) => {
    try {
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
}
