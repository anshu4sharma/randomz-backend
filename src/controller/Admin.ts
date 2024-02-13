import Users from "../model/UserSchema";
import ClaimRequests from "../model/ClaimRequests";
import jwt from "jsonwebtoken";
import { EMAIL, JWT_ACCESS_SECRET } from "../constant/env";
import { transporter } from "../config/mail-server";
import { Request, Response } from "express";
import Transaction from "../model/Transaction";
import mongoose from "mongoose";
export default class UserController {
  static sendLoginOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Please fill all fields!" });
      }
      const otp = Math.floor(Math.random() * 9000 + 1000);
      const mailData = {
        from: EMAIL,
        to: req.body.email,
        subject: "Verifcation code",
        text: null,
        html: `<span>Your Verification code is ${otp}</span>`,
      };
      let userInfo = await Users.findOneAndUpdate(
        { email, role: "admin" },
        {
          otp,
        }
      );
      if (!userInfo) {
        return res.status(400).json({ message: "Invalid email" });
      }
      // return transporter.sendMail(mailData, (error, info) => {
      // console.log(info, error);
      // if (error) {
      //   res.status(500).send("Server error");
      // }
      return res.json({ message: "Otp has been sent successfully !" });
      // });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(403).send("please fill the data");
      }
      let IsValidme = await Users.findOne({ email: email, role: "admin" });
      if (!IsValidme) {
        return res.status(403).json({ message: "Invalid credential" });
      } else {
        let data = {
          email: IsValidme.email,
          role: IsValidme.role,
          _id: IsValidme._id,
        };
        if (IsValidme.otp == otp) {
          const authToken = jwt.sign({ data }, JWT_ACCESS_SECRET, {
            expiresIn: "10day",
          });
          return res.status(200).json({ authToken });
        } else {
          return res.status(403).json({ message: "Invalid credential" });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: (error as Error).message });
    }
  };
  static GET_ALL_TRANSACTIONS = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;

      const totalCount = await Transaction.countDocuments();

      const totalRecords = totalCount ? totalCount : 0;
      const totalPages = Math.ceil(totalRecords / perPage); // Calculate total pages

      const result = await Transaction.find({})
        .populate({ path: "user", select: "-password -otp" })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .sort({
          createdAt: -1,
        });

      res.status(200).json({
        result,
        page,
        perPage,
        totalRecords,
        totalPages, // Include total pages in the response
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  static GET_ALL_USERS = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;

      const totalRecords = await Users.countDocuments();
      const pipeline = [
        {
          $lookup: {
            from: "transactions",
            localField: "_id",
            foreignField: "user",
            as: "result",
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            result: 1,
            createdAt: 1,
            referalId: 1,
            referedBy: 1,
            totalPurchase: {
              $map: {
                input: "$result",
                as: "transaction",
                in: "$$transaction.amount",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            referalId: 1,
            referedBy: 1,
            createdAt: 1,
            selfpurchase: {
              $sum: "$totalPurchase",
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "referalId",
            foreignField: "referedBy",
            as: "result",
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            referalId: 1,
            referedBy: 1,
            createdAt: 1,
            selfpurchase: 1,
            totalrefferdUser: {
              $map: {
                input: "$result",
                as: "user",
                in: "$$user._id",
              },
            },
          },
        },
        {
          $addFields: {
            referedUsers: {
              $size: "$totalrefferdUser",
            },
          },
        },
        {
          $unwind: {
            path: "$totalrefferdUser",
          },
        },
        {
          $lookup: {
            from: "transactions",
            localField: "totalrefferdUser",
            foreignField: "user",
            as: "result",
          },
        },
        {
          $addFields: {
            totalSumofAmount: {
              $map: {
                input: "$result",
                as: "user",
                in: "$$user.amount",
              },
            },
          },
        },
        {
          $addFields: {
            totalReferedUsersPurchaseSum: {
              $sum: "$totalSumofAmount",
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            email: {
              $first: "$email",
            },
            referalId: {
              $first: "$referalId",
            },
            referedBy: {
              $first: "$referedBy",
            },
            createdAt: {
              $first: "$createdAt",
            },
            selfpurchase: {
              $first: "$selfpurchase",
            },
            referedUsers: {
              $first: "$referedUsers",
            },
            totalReferedUsersPurchaseSum: {
              $first: "$totalReferedUsersPurchaseSum",
            },
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort by createdAt in descending order
        },
        {
          $skip: (page - 1) * perPage,
        },
        {
          $limit: perPage,
        },
      ];
      const result = await Users.aggregate(pipeline as any);
      res.status(200).json({
        result,
        page,
        perPage,
        totalRecords, // Include totalCount in the response
        totalPages: Math.ceil(totalRecords / perPage), // Calculate and include totalPages
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  static GET_ALL_CLAIM_REQUESTS = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const totalCount = await ClaimRequests.countDocuments();
      const result = await ClaimRequests.find({})
        .skip((page - 1) * perPage)
        .limit(perPage);

      res.status(200).json({
        result,
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
  static HANDLE_CLAIM_REQUEST = async (req: Request, res: Response) => {
    try {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ message: "Please fill all fields!" });
      }
      let data = await ClaimRequests.findById(id);
      if (!data) {
        return res.status(400).json({ message: "Invalid id" });
      }
      if (data.status == "approved" || data.status == "rejected") {
        return res
          .status(400)
          .json({ message: "Already claim request is processed" });
      }
      data.status = status;
      if (status == "approved") {
        let user = await Users.findOne({ email: data.email });
        if (!user) {
          return res.status(400).json({ message: "Invalid email" });
        }
        // if user.reward is less than data.amount then return error
        if (user.reward < data.amount) {
          return res
            .status(400)
            .json({ message: "Insufficient reward balance" });
        }
        user.reward = user.reward - data.amount;
        data.transactionId = req.body.transactionId;
        await user.save();
        await data.save();
        // handle claim maybe ned to mulitply by 100 incase we dont multiplt the amlunt by 100 fron frontend
        return res.status(200).json({ message: "Claim request updated" });
      } else if (status == "rejected") {
        return res.status(200).json({ message: "Claim request updated" });
      } else {
        return res.status(403).json({ message: "Invalid transaction status" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  static FIND_TEAM = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "Please fill all fields!" });
      }
      const page = parseInt(req.query.page as string) || 1; // Default to page 1 if not provided
      const perPage = parseInt(req.query.perPage as string) || 10; // Default to 10 items per page
      const skip = (page - 1) * perPage;
      const data = await Users.find(
        { referedBy: req.params.id },
        {
          _id: 1,
          email: 1,
          createdAt: 1,
          referedBy: 1,
          referalId: 1,
          reward: 1,
        }
      )
        .skip(skip)
        .limit(perPage);

      const totalCount = await Users.countDocuments({
        referedBy: req.params.id,
      });

      if (data.length > 0) {
        return res.status(200).json({
          data,
          page,
          perPage,
          totalRecords: totalCount,
          totalPages: Math.ceil(totalCount / perPage),
        });
      } else {
        return res.status(400).json({ message: "No team found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error" });
    }
  };
}