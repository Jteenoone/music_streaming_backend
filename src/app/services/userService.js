const User = require("../models/userModel");

const getMyProfileService = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    return { success: false, status: 404, message: "User này không tồn tại" };
  }
  return { success: true, data: user };
};

const updateMyProfileService = async (userId, data) => {
  const safeData = {
    username: data.username,
    avatar: data.avatar,
  };
  const updatedUser = await User.findByIdAndUpdate(userId, safeData, {
    new: true,
  }).select("-password");

  if (!updatedUser) {
    return { success: false, status: 404, message: "Người dùng không tồn tại" };
  }
  return { success: true, data: updatedUser };
};

module.exports = { getMyProfileService, updateMyProfileService };
