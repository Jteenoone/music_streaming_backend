const albumService = require("../services/albumService");

const createAlbum = async (req, res) => {
  try {
    // Đã bổ sung lại 'songs' để nhận mảng bài hát từ Frontend
    const { title, artist, coverImage, releaseYear, songs } = req.body;

    if (!title || !artist) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập tên album và ID ca sĩ" });
    }

    // Truyền luôn 'songs' sang cho Bếp trưởng (Service) xử lý
    const result = await albumService.createAlbumService({
      title,
      artist,
      coverImage,
      releaseYear,
      songs,
    });

    res
      .status(201)
      .json({ message: "Tạo thành công Album", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

const getAllAlbums = async (req, res) => {
  try {
    const result = await albumService.getAllAlbumsService();
    res.status(200).json({
      message: "Lấy danh sách Albums thành công",
      total: result.data.length,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//
const getAlbumById = async (req, res) => {
  try {
    const albumId = req.params.id;

    const result = await albumService.getAlbumByIdService(albumId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res
      .status(200)
      .json({ message: "Lấy chi tiết Album thành công", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Cập nhật thông tin cơ bản của Album (Chỉ sửa tên, năm phát hành, ảnh bìa...)
const updateAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    // Lấy req.body ra, nếu Frontend có lỡ gửi kèm mảng 'songs' thì vứt nó đi, không cho phép update qua đường này.

    const result = await albumService.updateAlbumService(albumId, req.body);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "Cập nhật thông tin Album thành công!",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// 5. Xóa Album
const deleteAlbum = async (req, res) => {
  try {
    const result = await albumService.deleteAlbumService(req.params.id);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã xóa Album thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

const addSongToAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: "Vui lòng cung cấp ID bài hát!" });
    }

    // Tuyệt chiêu $addToSet: Thêm ID vào mảng nhưng CHỐNG TRÙNG LẶP
    const result = await albumService.addSongToAlbumService(albumId, songId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "Đã thêm bài hát vào Album thành công!",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

const removeSongFromAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    const { songId } = req.params.songId;

    if (!songId) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp ID bài hát cần xóa!" });
    }

    const result = await albumService.removeSongFromAlbumService(
      albumId,
      songId,
    );
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "Đã xóa bài hát khỏi Album!",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

module.exports = {
  createAlbum,
  getAllAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongToAlbum,
  removeSongFromAlbum,
};
