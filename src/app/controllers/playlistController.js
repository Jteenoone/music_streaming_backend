const playlistService = require("../services/playlistService");

const createPlaylist = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Vui long nhap ten cua playlist" });
    }

    const result = await playlistService.createPlaylistService(name, userId);
    res
      .status(201)
      .json({ message: "Tao playlist thanh cong", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const addSongToPlaylist = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { songId } = req.body;
    const userId = req.user.id;

    if (!songId) {
      return res.status(400).json({ message: "Vui long cung cap ID bai hat" });
    }

    const result = await playlistService.addSongToPlaylistService(
      songId,
      userId,
      playlistId,
    );

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res.status(200).json({ message: "Thêm bài hát thành công" });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

//Lay het danh sach playlist cua nguoi dung dang dang nhap

const getUserPlayLists = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await playlistService.getUserPlaylistsService(userId);
    res.status(200).json({
      message: "Lay danh sach playlist thanh cong",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

//Lay chi tiet 1 playlist

const getPlaylistById = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user.id;

    const result = await playlistService.getPlaylistByIdService(
      playlistId,
      userId,
    );

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "Lấy chi tiết Playlist thành công!",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const removeSongFromPlaylist = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { songId } = req.body;
    const userId = req.user.id;

    if (!songId) {
      return res.status(400).json({ message: "Vui lòng cung cấp ID bài hát." });
    }

    const result = await playlistService.removeSongFromPlaylistService(
      playlistId,
      songId,
      userId,
    );
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã xoá bài hát khỏi playlist" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user.id;

    const result = await playlistService.deletePlaylistService(
      playlistId,
      userId,
    );

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res.status(200).json({ message: "Đã xoá Playlist" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  createPlaylist,
  addSongToPlaylist,
  getUserPlayLists,
  getPlaylistById,
  deletePlaylist,
  removeSongFromPlaylist,
};
