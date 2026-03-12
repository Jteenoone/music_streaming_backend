const songService = require("../services/songService");

const createSong = async (req, res) => {
  try {
    const { title, artist, album, audioUrl, coverImage, duration, genre } =
      req.body;

    if (!title || !artist || !audioUrl || !duration || !genre) {
      return res
        .status(400)
        .json({ message: "Vui long nhap day du thong tin bai hat" });
    }

    const result = await songService.createSongService(req.body);

    res.status(201).json({ message: "Them thanh cong", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

//GET lay danh sach bai hat

const getAllSongs = async (req, res) => {
  try {
    const result = await songService.getAllSongsService();

    res.status(200).json({
      message: "lay thanh cong",
      data: result.data,
      total: result.data.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
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
    res.status(500).json({ message: "loi he thong" });
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

module.exports = {
  createSong,
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong,
};
