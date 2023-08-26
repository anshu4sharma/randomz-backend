const express = require("express");
const router = new express.Router();
const authUser = require("../middleware/authUser");

const UserController = require("../controller/User");

router.post("/sendemail", UserController.sendEmail);

router.post("/", UserController.signup);

router.post("/login", UserController.login);

// Handle password update
router.post("/reset-password",UserController.resetPassword);
// verify otp and update password
router.put("/verify-reset-otp", UserController.verify_Reset_Password_Otp);

router.get("/fetch-user", authUser, UserController.fetch_User_details);

router.get("/get-all-users",UserController.GET_ALL_USERS);

router.put("/block/:userId", UserController.BLOCK_USER_ACCOUNT);

router.post("/addTransaction", authUser,UserController.addTransaction);

router.get("/gettotal",authUser, UserController.GET_TOTAL_PURCHASE_AMOUNT);

router.get("/getallamount",authUser,UserController.GET_TOTAL_PURCHASE_OF_ALL_USERS );

router.post("/claimreward",authUser,UserController.CLAIM_REQUEST );

router.get("/getalltransactions",authUser,UserController.GET_ALL_TRANSACTIONS);

router.get("/getreferalId",authUser,UserController.GET_REFFERAL_ID);
module.exports = router;
