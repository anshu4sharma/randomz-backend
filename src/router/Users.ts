import express from "express";
import authUser from "../middleware/authUser";
import UserController from "../controller/User";

const router = express.Router();

router.post("/sendemail", UserController.sendEmail);

router.post("/", UserController.signup);

router.post("/login", UserController.login);

// Handle password update
router.post("/reset-password", UserController.resetPassword);

// verify otp and update password
router.put("/verify-reset-otp", UserController.verify_Reset_Password_Otp);

router.post("/addTransaction", authUser, UserController.addTransaction);

router.get("/gettotal", authUser, UserController.GET_TOTAL_PURCHASE_AMOUNT);

router.get("/getallamount", authUser, UserController.GET_TOTAL_PURCHASE_OF_ALL_USERS);

router.post("/claimreward", authUser, UserController.CLAIM_REQUEST);

// get all the transaction of loggedIn User
router.get("/getalltransactions", authUser, UserController.GET_ALL_TRANSACTIONS);

router.get("/getreferalId", authUser, UserController.GET_REFFERAL_ID);

router.get("/getclaimrequests", authUser, UserController.GET_CLAIM_REQUESTS);

export default router;
