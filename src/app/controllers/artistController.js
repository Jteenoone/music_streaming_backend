const artistService = require("../services/artistService");



const createArtist = async (req, res) => {
  try {
    const { name, imageUrl, bio, nationality } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Vui long nhap ten" });
    }

    const result = await artistService.createArtistService(req.body);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res
      .status(201)
      .json({ message: "Tao ca si thanh cong", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

//[GET] /api/artists

const getAllArtists = async (req, res) => {
  try {
    const result = await artistService.getAllArtistsService();
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "danh sach ca si",
      data: result.data,
      total: result.data.length,
    });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const getArtistById = async (req, res) => {
  try {
    const artistId = req.params.id;
    const result = await artistService.getArtistByIdService(artistId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Da tim thay", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

// [PUT] /api/artist/:id
const updateArtist = async (req, res) => {
  try {
    const artistId = req.params.id;

    const result = await artistService.updateArtistService(artistId, req.body);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Da cap nhat", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

//[DELETE] /api/artists/:id
const deleteArtist = async (req, res) => {
  try {
    const artistId = req.params.id;
    const result = await artistService.deleteArtistService(artistId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Đã xoá thành công Artist" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getArtistSongs = async (req, res) => {
  try {
    const result = await artistService.getArtistSongsService(req.params.id);
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(200).json({ message: "Bài hát của ca sĩ", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  createArtist,
  getAllArtists,
  getArtistById,
  getArtistSongs,
  updateArtist,
  deleteArtist,
};
