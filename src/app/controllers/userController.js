const userService = require("../services/userService");

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.getMyProfileService(userId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    return res
      .status(200)
      .json({ message: "Lấy thông tin User thành công", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.updateMyProfileService(userId, req.body);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({
      message: "Cập nhật thông tin User thành công",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = { getMyProfile, updateMyProfile };
