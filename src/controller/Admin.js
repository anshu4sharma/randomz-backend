const Users = require("../model/UserSchema");
require("dotenv").config();
const nodemailer = require("nodemailer");
const ClaimRequests = require("../model/ClaimRequests");
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const jwt = require("jsonwebtoken");
const transporter = nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  secure: true,
});

module.exports = class UserController {
  static sendLoginOtp = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Please fill all fields!" });
      }
      const otp = Math.floor(Math.random() * 9000 + 1000);
      const mailData = {
        from: process.env.EMAIL,
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
      return transporter.sendMail(mailData, (error, info) => {
        console.log(info, error);
        if (error) {
          res.status(500).send("Server error");
        }
        return res.json({ message: "Otp has been sent successfully !" });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  static login = async (req, res) => {
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
      res.status(500).json({ message: error.message });
    }
  };
  static GET_ALL_TRANSACTIONS = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;

      const totalCount = await Users.aggregate([
        {
          $match: {
            transactionIds: { $exists: true, $ne: [] },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "referedBy",
            foreignField: "_id",
            as: "referedByUser",
          },
        },
        {
          $unwind: "$transactionIds",
        },
        {
          $count: "total",
        },
      ]);

      const totalRecords = totalCount[0] ? totalCount[0].total : 0;
      const totalPages = Math.ceil(totalRecords / perPage); // Calculate total pages

      const pipeline = [
        {
          $match: {
            transactionIds: { $exists: true, $ne: [] },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "referedBy",
            foreignField: "_id",
            as: "referedByUser",
          },
        },
        {
          $unwind: "$transactionIds",
        },
        {
          $addFields: {
            transactionId: "$transactionIds.txid",
          },
        },
        {
          $project: {
            _id: 0,
            referedBy: 1,
            transactionId: 1,
            createdAt: 1,
            amount: "$transactionIds.amount",
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

      const result = await Users.aggregate(pipeline);
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
  static GET_ALL_USERS = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;

      const totalRecords = await Users.countDocuments();

      const pipeline = [
        {
          $project: {
            _id: 1,
            referedUsers: 1,
            email: 1,
            selfpurchase: { $sum: "$transactionIds.amount" },
            createdAt: 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            referedUsers: { $first: "$referedUsers" },
            email: { $first: "$email" },
            selfpurchase: { $first: "$selfpurchase" },
            createdAt: { $first: "$createdAt" },
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
      const result = await Users.aggregate(pipeline);
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
  static GET_ALL_CLAIM_REQUESTS = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;
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
  static HANDLE_CLAIM_REQUEST = async (req, res) => {
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
      await data.save();
      if (status == "approved") {
        await Users.findOneAndUpdate(
          { email: data.email },
          { $inc: { reward: -data.amount } }
        );
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
};
