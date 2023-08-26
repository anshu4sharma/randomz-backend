const express = require("express");
const router = new express.Router();
const isAdmin = require("../middleware/isAdmin");
const reqId = require("../middleware/reqId");
const AdminController = require("../controller/Admin");
const UserController = require("../controller/User");

router.post("/login-otp", AdminController.sendLoginOtp);

router.post("/login", AdminController.login);

router.get("/get-all-users", isAdmin, AdminController.GET_ALL_USERS);

router.get("/get-all-transactions", isAdmin, AdminController.GET_ALL_TRANSACTIONS);

router.get("/get-all-claimrequest", isAdmin, AdminController.GET_ALL_CLAIM_REQUESTS);

router.post("/update-claimrequest", isAdmin, AdminController.HANDLE_CLAIM_REQUEST);

router.get("/get-user-transactions/:id",reqId, isAdmin, UserController.GET_ALL_TRANSACTIONS);

module.exports = router;
