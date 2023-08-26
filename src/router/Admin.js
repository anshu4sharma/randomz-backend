const express = require("express");
const router = new express.Router();
const authUser = require("../middleware/authUser");

const AdminController = require("../controller/Admin");
router.get("/login", AdminController.login);

router.get("/get-all-users", AdminController.GET_ALL_USERS);

router.get("/get-all-transactions", AdminController.GET_ALL_TRANSACTIONS);

router.get("/get-all-claimrequest", AdminController.GET_ALL_CLAIM_REQUESTS);

router.post("/update-claimrequest", AdminController.HANDLE_CLAIM_REQUEST);


module.exports = router;
