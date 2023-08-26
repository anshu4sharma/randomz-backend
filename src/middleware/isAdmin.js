require("dotenv").config();
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
const jwt = require("jsonwebtoken");
const Users = require("../model/UserSchema");

const isAdmin = async (req, res, next) => {
  const token = req.headers["auth-token"];
  try {
    if (!token) {
      return res.status(401).send("Access denied");
    }
    const { data } = jwt.verify(token, JWT_SECRET);
    const user = await Users.findById(data._id);
    if (user.role != "admin") {
      return res.status(401).send("Access denied");
    }
    next();
  } catch (error) {
    res.status(401).send("Access denied");
  }
};

module.exports = isAdmin;
