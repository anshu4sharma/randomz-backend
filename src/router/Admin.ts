import express from "express";
import isAdmin from "../middleware/isAdmin";
import reqId from "../middleware/reqId";
import AdminController from "../controller/Admin";
import UserController from "../controller/User";

const router = express.Router();

router.post("/login-otp", AdminController.sendLoginOtp);

router.post("/login", AdminController.login);

router.get("/get-all-users", isAdmin, AdminController.GET_ALL_USERS);

router.get("/get-all-transactions", isAdmin, AdminController.GET_ALL_TRANSACTIONS);

router.get("/get-all-claimrequest", isAdmin, AdminController.GET_ALL_CLAIM_REQUESTS);

router.post("/update-claimrequest", isAdmin, AdminController.HANDLE_CLAIM_REQUEST);

// get all the transaction of a specific User throuh admin panel
router.get("/get-user-transactions/:id", reqId, isAdmin, UserController.GET_ALL_TRANSACTIONS);

router.get("/find-team/:id", isAdmin, AdminController.FIND_TEAM);

export default router;
