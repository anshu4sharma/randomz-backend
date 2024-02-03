
const reqId = async (req, res, next) => {
  const token = req.params.id;
  try {
    if (!token) {
      return res.status(401).send("Access denied");
    }
    req.id = token;
    next();
  } catch (error) {
    res.status(401).send("Access denied");
  }
};

export default reqId;
