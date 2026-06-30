import User from "../../models/User.js";

const allUsers = async () => {
  const result = await User.find();
  return result;
};

const updateProfile = async (userId, updateData) => {
  const result = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
  return result;
};

export const userServices = {
  allUsers,
  updateProfile,
};
