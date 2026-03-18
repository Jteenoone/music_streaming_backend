const { getTestMessageUrl } = require("nodemailer");
const songService = require("../services/songService");

const createSong = async (req, res) => {
  try {
    const data = req.body;

    if (req.files && req.files.audioFile) {
      data.audioUrl = req.files.audioFile[0].path;
    } else {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên file nhạc MP3!" });
    }

    if (req.files && req.files.coverImage) {
      data.coverImage = req.files.coverImage[0].path;
    }

    const result = await songService.createSongService(data);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(201).json({ message: "Them thanh cong", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong", error: error.message });
  }
};

//GET lay danh sach bai hat
const getAllSongs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await songService.getAllSongsService(page, limit);

    res.status(200).json({
      message: "Lấy danh sách bài hát thành công",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong", error: error.message });
  }
};

//GET /song/:id
const getSongById = async (req, res) => {
  try {
    const songId = req.params.id;

    const result = await songService.getSongByIdService(songId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "da tim thay bai hat", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong", error: error.message });
  }
};

//PUT

const updateSong = async (req, res) => {
  try {
    const songId = req.params.id;

    const result = await songService.updateSongService(songId, req.body);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Da cap nhat", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

//delete

const deleteSong = async (req, res) => {
  try {
    const songId = req.params.id;
    const result = await songService.deleteSongService(songId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Da xoa bai hat" });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const incrementPlayCount = async (req, res) => {
  try {
    const songId = req.params.id;
    const result = await songService.incrementPlayCountService(songId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã tăng lượt nghe", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getTrendingSong = async (req, res) => {
  try {
    const result = await songService.getTrendingSongService();
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    return res
      .status(200)
      .json({ message: "Lấy bảng xếp hạng thành công", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const search = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập từ khoá tìm kiếm!" });
    }
    const result = await songService.searchService(keyword);
    return res
      .status(200)
      .json({ message: `Kết quả tìm kiếm cho ${keyword}`, data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

module.exports = {
  createSong,
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong,
  getTrendingSong,
  incrementPlayCount,
  search,
};
