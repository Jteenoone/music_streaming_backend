const User = require("../models/userModel");

const bcrypt = require("bcryptjs");

const getMyProfileService = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    return { success: false, status: 404, message: "User này không tồn tại" };
  }
  return { success: true, data: user };
};

const updateMyProfileService = async (userId, data) => {
  if (data.email) {
    const existingEmail = await User.findOne({
      email: data.email,
      _id: { $ne: userId },
    });
    if (existingEmail) {
      return { success: false, status: 400, message: "Email này đã tồn tại" };
    }
  }
  const safeData = {
    username: data.username,
    avatar: data.avatar,
    email: data.email,
  };
  const updatedUser = await User.findByIdAndUpdate(userId, safeData, {
    new: true,
  }).select("-password");

  if (!updatedUser) {
    return { success: false, status: 404, message: "Người dùng không tồn tại" };
  }
  return { success: true, data: updatedUser };
};

const getAllUsersService = async () => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });

  return { success: true, data: users };
};

const deleteUserService = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return {
      success: false,
      status: 404,
      message: "Không tìm thấy người dùng",
    };
  }
  return { success: true };
};

const changePasswordService = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    return {
      success: false,
      status: 404,
      message: "Không tìm thấy người dùng",
    };
  }
  if (!user.password) {
    return {
      success: false,
      status: 400,
      message: "Bạn đăng nhập bằng Google nên không thay đổi được mật khẩu!",
    };
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return { success: false, status: 400, message: "Mật khẩu cũ không đúng!" };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();

  return { success: true };
};

const getLibraryService = async (userId) => {
  const user = await User.findById(userId)
    .populate("followedArtists", "name imageUrl")
    .populate("savedAlbums", "title coverImage artist")
    .select("followedArtists savedAlbums");
  if (!user) return { success: false, status: 404, message: "Không tìm thấy user" };
  return { success: true, data: { artists: user.followedArtists, albums: user.savedAlbums } };
};

const toggleFollowArtistService = async (userId, artistId) => {
  const user = await User.findById(userId);
  if (!user) return { success: false, status: 404, message: "Không tìm thấy user" };
  const idx = user.followedArtists.findIndex(id => id.toString() === artistId);
  if (idx === -1) {
    user.followedArtists.push(artistId);
  } else {
    user.followedArtists.splice(idx, 1);
  }
  await user.save();
  return { success: true, following: idx === -1, message: idx === -1 ? "Đã theo dõi" : "Đã bỏ theo dõi" };
};

const toggleSaveAlbumService = async (userId, albumId) => {
  const user = await User.findById(userId);
  if (!user) return { success: false, status: 404, message: "Không tìm thấy user" };
  const idx = user.savedAlbums.findIndex(id => id.toString() === albumId);
  if (idx === -1) {
    user.savedAlbums.push(albumId);
  } else {
    user.savedAlbums.splice(idx, 1);
  }
  await user.save();
  return { success: true, saved: idx === -1, message: idx === -1 ? "Đã lưu album" : "Đã bỏ lưu" };
};

const recordPlayService = async (userId, songId) => {
  const user = await User.findById(userId);
  if (!user) return { success: false };
  user.recentlyPlayed = user.recentlyPlayed.filter(p => p.song.toString() !== songId.toString());
  user.recentlyPlayed.unshift({ song: songId, playedAt: new Date() });
  if (user.recentlyPlayed.length > 20) user.recentlyPlayed = user.recentlyPlayed.slice(0, 20);
  await user.save();
  return { success: true };
};

const getRecentlyPlayedService = async (userId) => {
  const user = await User.findById(userId)
    .populate({
      path: "recentlyPlayed.song",
      populate: { path: "artist", select: "name imageUrl" },
    })
    .select("recentlyPlayed");
  if (!user) return { success: false, status: 404, message: "Không tìm thấy user" };
  return { success: true, data: user.recentlyPlayed.filter(p => p.song) };
};

module.exports = {
  getMyProfileService,
  updateMyProfileService,
  getAllUsersService,
  deleteUserService,
  changePasswordService,
  getLibraryService,
  toggleFollowArtistService,
  toggleSaveAlbumService,
  recordPlayService,
  getRecentlyPlayedService,
};
