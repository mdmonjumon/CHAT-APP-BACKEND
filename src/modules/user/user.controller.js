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

export const userController = {
  allUsers,
};
