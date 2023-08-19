require("dotenv").config();
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
const jwt = require("jsonwebtoken");

const authUser = (req, res, next) => {
  const token = req.headers["auth-token"];
  try {
    if (!token) {
     return res.status(401).send("Access denied");
    }
    const { data } = jwt.verify(token, JWT_SECRET);
    req.id = data.id;
    next();
  } catch (error) {
    res.status(401).send(error);
  }
};

module.exports = authUser;
