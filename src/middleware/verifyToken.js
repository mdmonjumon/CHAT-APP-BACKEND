import admin from "../config/firebase.js";
import User from "../models/User.js";

const verifyToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = req?.headers?.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    


    let mongoUser = await User.findOne({ firebaseUid: decodedToken.uid })

    if (mongoUser) {
        req.user = mongoUser; 
    } else {
        req.user = decodedToken;
    }

    next();
  } catch (error) {
    console.error("Token Verification Error:", error.message);
    return res
      .status(403)
      .json({ message: "Forbidden: Invalid or expired token" });
  }
};

export default verifyToken;
