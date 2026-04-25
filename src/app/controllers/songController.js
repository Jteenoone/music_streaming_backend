const songService = require("../services/songService");
const Artist = require("../models/artistModel");

const parseCopyright = (data) => {
  if (data.copyright && typeof data.copyright === "string") {
    try { data.copyright = JSON.parse(data.copyright); } catch {}
  }
};

const createSong = async (req, res) => {
  try {
    const data = { ...req.body };
    parseCopyright(data);

    if (req.files && req.files.audioFile) {
      data.audioUrl = req.files.audioFile[0].path;
    } else {
      return res.status(400).json({ message: "Vui lòng tải lên file nhạc MP3!" });
    }

    if (req.files && req.files.coverImage) {
      data.coverImage = req.files.coverImage[0].path;
    }

    // Nếu frontend gửi artistName (string) thay vì artist ObjectId
    // → tự động tìm hoặc tạo mới artist theo tên
    if (data.artistName && !data.artist) {
      let artist = await Artist.findOne({ name: data.artistName });
      if (!artist) {
        artist = await Artist.create({ name: data.artistName });
      }
      data.artist = artist._id;
      delete data.artistName;
    }

    const result = await songService.createSongService(data);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(201).json({ message: "Thêm thành công", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

const getAllSongs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const showAll = req.user?.role === "admin";

    const result = await songService.getAllSongsService(page, limit, showAll);

    res.status(200).json({
      message: "Lấy danh sách bài hát thành công",
      data: result.data.songs,
      pagination: result.data.pagination,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

const getSongById = async (req, res) => {
  try {
    const songId = req.params.id;
    const showAll = req.user?.role === "admin";
    const result = await songService.getSongByIdService(songId, showAll);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã tìm thấy bài hát", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

const updateSong = async (req, res) => {
  try {
    const songId = req.params.id;
    const data = { ...req.body };
    parseCopyright(data);

    if (req.files?.audioFile) data.audioUrl = req.files.audioFile[0].path;
    if (req.files?.coverImage) data.coverImage = req.files.coverImage[0].path;

    if (data.artistName && !data.artist) {
      let artist = await Artist.findOne({ name: data.artistName });
      if (!artist) artist = await Artist.create({ name: data.artistName });
      data.artist = artist._id;
      delete data.artistName;
    }

    const result = await songService.updateSongService(songId, data);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã cập nhật", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const deleteSong = async (req, res) => {
  try {
    const songId = req.params.id;
    const result = await songService.deleteSongService(songId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã xóa bài hát" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const incrementPlayCount = async (req, res) => {
  try {
    const songId = req.params.id;
    const result = await songService.incrementPlayCountService(songId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã tăng lượt nghe", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getTrendingSong = async (req, res) => {
  try {
    const result = await songService.getTrendingSongService();
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({ message: "Lấy bảng xếp hạng thành công", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const search = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) {
      return res.status(400).json({ message: "Vui lòng nhập từ khoá tìm kiếm!" });
    }
    const result = await songService.searchService(keyword);
    // Trả về songs array trực tiếp để frontend dễ xử lý
    return res.status(200).json({
      message: `Kết quả tìm kiếm cho ${keyword}`,
      data: result.data.songs,
      artists: result.data.artists,
      albums: result.data.albums,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

const getRecommended = async (req, res) => {
  try {
    // excludeIds: danh sách id bài đã nghe trong session, truyền qua query ?exclude=id1,id2
    const excludeIds = req.query.exclude ? req.query.exclude.split(',') : [];
    const result = await songService.getRecommendedService(req.params.id, excludeIds);
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(200).json({ message: "Gợi ý bài hát", data: result.data });
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
  getRecommended,
};
