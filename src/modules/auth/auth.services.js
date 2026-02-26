import User from "../../models/User.js";

const signupUserIntoDB = async (userInfo) => {
  const { firebaseUid } = userInfo;
  const result = await User.findOneAndUpdate(
    { firebaseUid },
    { ...userInfo, isOnline: true },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
    },
  );

  console.log(result);
  return result;
};

export const authService = {
  signupUserIntoDB,
};
