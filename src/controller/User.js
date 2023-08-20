const Users = require("../model/UserSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { Generate_Referal_Id, isAlready_Verified } = require("../utils/Users");
require("dotenv").config();
const saltround = 10;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
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
  static sendEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(403).json({
        message: "Please fill all the fields",
      });
    } else {
      try {
        const otp = Math.floor(Math.random() * 9000 + 1000);
        let user = {
          email,
          otp,
        };
        const mailData = {
          from: process.env.EMAIL,
          to: req.body.email,
          subject: "Verifcation code",
          text: null,
          html: `<span>Your Verification code is ${otp}</span>`,
        };
        let userInfo = new Users(user);
        let IsEmail = await Users.findOne({ email: req.body.email });
        if (IsEmail) {
          return res.status(403).json({ message: "Account already exists" });
        } else {
          await userInfo.save();
          transporter.sendMail(mailData, (error, info) => {
            if (error) {
              res.status(500).send(error);
            }
            res.json({ message: "Otp has been sent successfully !" });
          });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
      }
    }
  };

  static signup = async (req, res) => {
    const { email, password, referedBy, otp } = req.body;
    if (!email || !password || !otp) {
      return res.status(403).json({
        message: "Please fill all the fields",
      });
    }
    try {
      let IsValid = await Users.findOne({
        $and: [{ email: req.body.email }, { otp: req.body.otp }],
      });
      if (IsValid) {
        if (IsValid.isVerified) {
          return res.status(200).json({
            message: "Already Verified !",
          });
        }
        let salt = await bcrypt.genSalt(saltround);
        let hash_password = await bcrypt.hash(password, salt);
        if (referedBy) {
          let referedByUser = await Users.findOne({ referalId: referedBy });
          if (!referedByUser) {
            return res.status(403).json({
              message: "Invalid referal Id",
            });
          }
          if (referedByUser.isBlocked) {
            return res.status(403).json({
              message: "Your account has been blocked by admin",
            });
          }
          if (referedByUser.isVerified) {
            let referedUsers = referedByUser.referedUsers;
            referedUsers.push({
              email: req.body.email,
              _id: IsValid._id,
            });
            await Users.findOneAndUpdate(
              { referalId: referedBy },
              { referedUsers },
              {
                returnOriginal: false,
              }
            );
          }
        }
        await Users.findOneAndUpdate(
          { email: req.body.email },
          {
            isVerified: true,
            password: hash_password,
            referedBy: referedBy,
            referalId: Generate_Referal_Id(),
          },
          {
            returnOriginal: false,
          }
        );
        return res
          .status(200)
          .json({ message: "You are now successfully verified" });
      } else {
        return res.status(401).json({ message: "Wrong Otp !" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  static login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(403).send("please fill the data");
      }
      let IsValidme = await Users.findOne({ email: email });
      if (!IsValidme) {
        return res.status(403).json({ message: "Invalid credential" });
      } else {
        if (IsValidme.isVerified) {
          let data = {
            id: IsValidme.id,
            name: IsValidme.email,
          };
          let isMatch = await bcrypt.compare(password, IsValidme.password);
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
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  };
  static resetPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(403).json({
        message: "Please fill all the fields",
      });
    }
    const otp = Math.floor(Math.random() * 9000 + 1000);
    const mailData = {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: "Verifcation code for password reset",
      text: null,
      html: `<span>Your Verification code is ${otp}</span>`,
    };
    try {
      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(403).json({
          message: "User with this email does not exist",
        });
      } else {
        user.otp = otp;
        await user.save();
        transporter.sendMail(mailData, (error, info) => {
          if (error) {
            return res.status(500).send("Server error");
          }
          return res.json({ message: "Otp has been sent successfully !" });
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error });
    }
  };
  static verify_Reset_Password_Otp = async (req, res) => {
    try {
      let salt = await bcrypt.genSalt(saltround);
      let hash_password = await bcrypt.hash(req.body.password, salt);
      let IsValid = await Users.findOne({
        $and: [{ email: req.body.email }, { otp: req.body.otp }],
      });
      if (IsValid) {
        await Users.findOneAndUpdate(
          { email: req.body.email },
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
      console.log(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  static fetch_User_details = async (req, res) => {
    try {
      const user = await Users.findById(req.id);
      res.status(200).json({ user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  static GET_ALL_USERS = async (req, res) => {
    try {
      const users = await Users.find({ role: "user" }).select("-password");
      res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  static BLOCK_USER_ACCOUNT = async (req, res) => {
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
  static addTransaction = async (req, res) => {
    try {
      const { account, txid, amount } = req.body;
      if (!account || !txid || !amount) {
        return res.status(403).json({ error: "Please fill all the fields" });
      }
      const transaction = {
        account,
        txid,
        amount,
        isRewarded: false,
      };
      const user = await Users.findById(req.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.referedBy) {
        const referedByuser = await Users.findOne({
          referalId: user.referedBy,
        });
        let totalReferredTransactionAmount;
        try {
          // Aggregate total transaction amount of referred users
          totalReferredTransactionAmount = await Users.aggregate([
            {
              $match: {
                _id: {
                  $in: referedByuser.referedUsers.map((refUser) => refUser._id),
                },
              },
            },
            {
              $unwind: "$transactionIds",
            },
            {
              $match: {
                "transactionIds.isRewarded": false,
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$transactionIds.amount" },
              },
            },
          ]);
        } catch (error) {
          console.log(error);
        }
        console.log(
          totalReferredTransactionAmount,
          "totalReferredTransactionAmount"
        );
        if (totalReferredTransactionAmount.length < 1) {
          console.log("-------------");
          user.transactionIds.push({
            ...transaction,
            isRewarded: false,
          });
          await user.save();
          return res
            .status(200)
            .json({ message: "Transaction ID appended successfully" });
        }
        console.log(referedByuser.referedUsers);
        if (
          amount / 100 > 1000 &&
          amount / 100 < 5000 &&
          amount / 100 < 10000
        ) {
          referedByuser.balance += 50 * 100;
          referedByuser.rewardedTransactions.push({
            ...transaction,
            isRewarded: true,
          });
          await Users.findOneAndUpdate(
            { _id: req.id },
            {
              $set: {
                'transactionIds.$[].isRewarded': true
              }
            }
          );

          await referedByuser.save();
          user.transactionIds.push({
            ...transaction,
            isRewarded: true,
          });
          await user.save();
          console.log(1111111111111111111111);
          return res
            .status(200)
            .json({ message: "Transaction ID appended successfully" });
        } else if (amount / 100 > 5000 && amount / 100 < 10000) {
          user.transactionIds.push({
            ...transaction,
            isRewarded: true,
          });
          await Users.findOneAndUpdate(
            { _id: req.id },
            {
              $set: {
                'transactionIds.$[].isRewarded': true
              }
            }
          );
          referedByuser.rewardedTransactions.push({
            ...transaction,
            isRewarded: true,
          });
          await user.save();
          await referedByuser.save();
          console.log(2222222222222222);
          return res
            .status(200)
            .json({ message: "Transaction ID appended successfully" });
        } else if (amount / 100 > 10000) {
          user.transactionIds.push({
            ...transaction,
            isRewarded: true,
          });
          referedByuser.balance += 100 * 750;
          referedByuser.rewardedTransactions.push({
            ...transaction,
            isRewarded: true,
          });
          await Users.findOneAndUpdate(
            { _id: req.id },
            {
              $set: {
                'transactionIds.$[].isRewarded': true
              }
            }
          );
          await user.save();
          await referedByuser.save();
          console.log(1333333111111111111);

          return res
            .status(200)
            .json({ message: "Transaction ID appended successfully" });
        } else if (totalReferredTransactionAmount[0].totalAmount / 100 > 1000) {
          // Update previous transactions to have isRewarded: true
          user.transactionIds.push({
            ...transaction,
            isRewarded: true,
          });
          referedByuser.balance += 50 * 100;
          referedByuser.rewardedTransactions.push({
            ...transaction,
            isRewarded: true,
          });
          await Users.findOneAndUpdate(
            { _id: req.id },
            {
              $set: {
                'transactionIds.$[].isRewarded': true
              }
            }
          );
          await user.save();
          await referedByuser.save();
          console.log(4444444444444444);
          return res
            .status(200)
            .json({ message: "Transaction ID appended successfully" });
        } else if (totalReferredTransactionAmount[0].totalAmount / 100 > 5000) {
          // Update previous transactions to have isRewarded: true
          await Users.findOneAndUpdate(
            { _id: req.id },
            {
              $set: {
                'transactionIds.$[].isRewarded': true
              }
            }
          );

          referedByuser.balance += 100 * 300;
          referedByuser.rewardedTransactions.push({
            ...transaction,
            isRewarded: true,
          });
          user.transactionIds.push({
            ...transaction,
            isRewarded: true,
          });
          await user.save();
          await referedByuser.save();
          console.log(55555555555555555);

          return res
            .status(200)
            .json({ message: "Transaction ID appended successfully" });
        } else if (
          totalReferredTransactionAmount[0].totalAmount / 100 >
          10000
        ) {
          await Users.findOneAndUpdate(
            { _id: req.id },
            {
              $set: {
                'transactionIds.$[].isRewarded': true
              }
            }
          );;

          referedByuser.balance += 100 * 750;
          referedByuser.rewardedTransactions.push({
            ...transaction,
            isRewarded: true,
          });
          user.transactionIds.push({
            ...transaction,
            isRewarded: true,
          });
          await user.save();
          console.log(666666666666666666);

          await referedByuser.save();
          return res
            .status(200)
            .json({ message: "Transaction ID appended successfully" });
        }
        console.log(777777777777777);
        user.transactionIds.push({
          ...transaction,
          isRewarded: false,
        });
        await user.save();
        return res
          .status(200)
          .json({ message: "Transaction ID appended successfully" });
      }
      console.log(88888888888888);
      user.transactionIds.push({
        ...transaction,
        isRewarded: false,
      });
      await user.save();
      return res
        .status(200)
        .json({ message: "Transaction ID appended successfully" });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Error in adding transaction", error });
    }
  };
  static GET_TOTAL_PURCHASE_AMOUNT = async (req, res) => {
    try {
      console.log(req.id, "uer");
      const user = await Users.findById(req.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const pipeline = [
        {
          $match: {
            _id: user._id,
          },
        },
        {
          $unwind: "$transactionIds",
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$transactionIds.amount" },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
          },
        },
      ];
      const results = await Users.aggregate(pipeline);
      console.log(results);
      if (results.length === 0) {
        return res.json({ total: 0 });
      }
      const total = results[0].total;
      res.json({ total });
    } catch (error) {
      console.error("Error fetching total:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  static GET_TOTAL_PURCHASE_OF_ALL_USERS = async (req, res) => {
    try {
      const pipeline = [
        {
          $match: {
            role: { $ne: "admin" }, // Exclude admin user
          },
        },
        {
          $unwind: "$transactionIds",
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$transactionIds.amount" },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
          },
        },
      ];
      const results = await Users.aggregate(pipeline);
      if (results.length === 0) {
        return res.json({ total: 0 });
      }
      const total = results[0].total;
      res.json({ total });
    } catch (error) {
      console.error("Error fetching total:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};
