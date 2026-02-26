import { authService } from "./auth.services.js";

// signup user details send to db
const signupUserIntoDB = async (req, res) => {
  try {
    const { fullName, profilePic } = req?.body;
    const { uid, email } = req?.user;
    const userInfo = {
      firebaseUid: uid,
      fullName: fullName || "Anonymous",
      email: email,
      profilePic: profilePic || "",
    };
    const result = await authService.signupUserIntoDB(userInfo);
    res.status(201).json({
      success: true,
      data: result,
      message: "User create success",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const authController = {
  signupUserIntoDB,
};
