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

const getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsersService();
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "Lấy danh sách người dùng thành công",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await userService.deleteUserService(userId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Xoá thành công người dùng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới" });
    }
    const result = await userService.changePasswordService(
      userId,
      oldPassword,
      newPassword,
    );

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
const getLibrary = async (req, res) => {
  try {
    const result = await userService.getLibraryService(req.user.id);
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(200).json({ message: "Thư viện", data: result.data });
  } catch {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const toggleFollowArtist = async (req, res) => {
  try {
    const result = await userService.toggleFollowArtistService(req.user.id, req.params.artistId);
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(200).json({ message: result.message, following: result.following });
  } catch {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const toggleSaveAlbum = async (req, res) => {
  try {
    const result = await userService.toggleSaveAlbumService(req.user.id, req.params.albumId);
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(200).json({ message: result.message, saved: result.saved });
  } catch {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const recordPlay = async (req, res) => {
  try {
    await userService.recordPlayService(req.user.id, req.params.songId);
    res.status(200).json({ message: "ok" });
  } catch {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getRecentlyPlayed = async (req, res) => {
  try {
    const result = await userService.getRecentlyPlayedService(req.user.id);
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(200).json({ message: "ok", data: result.data });
  } catch {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  deleteUser,
  changePassword,
  getLibrary,
  toggleFollowArtist,
  toggleSaveAlbum,
  recordPlay,
  getRecentlyPlayed,
};
