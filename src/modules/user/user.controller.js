import { userServices } from "./user.services.js";

const allUsers = async (req, res) => {
  try {
    const result = await userServices.allUsers();
    return res.status(201).json({
      success: true,
      data: result,
      message: "users retrieve success",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { fullName, profilePic } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const result = await userServices.updateProfile(userId, updateData);

    return res.status(200).json({
      success: true,
      data: result,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const userController = {
  allUsers,
  updateProfile,
};
