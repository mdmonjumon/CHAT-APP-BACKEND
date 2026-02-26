import User from "../../models/User.js";

const allUsers = async () => {
  const result = await User.find();
  return result;
};

export const userServices = {
  allUsers,
};
