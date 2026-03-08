const Song = require("../models/songModel");

const createSong = async (req, res) => {
  try {
    const { title, artist, album, audioUrl, coverImage, duration, genre } =
      req.body;

    if (!title || !artist || !audioUrl || !duration || !genre) {
      return res
        .status(400)
        .json({ message: "Vui long nhap day du thong tin bai hat" });
    }

    const newSong = new Song({
      title,
      artist,
      album,
      audioUrl,
      coverImage,
      duration,
      genre,
    });

    await newSong.save();

    res.status(201).json({ message: "Them thanh cong", data: newSong });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

//GET lay danh sach bai hat

const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().populate('artist', 'name imageUrl');

    res.status(200).json({
      message: "lay thanh cong",
      data: songs,
      total: songs.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

//GET /song/:id
const getSongById = async (req, res) => {
  try {
    const songId = req.params.id;
    const song = await Song.findById(songId).populate('artist', 'name imageUrl bio');
    if (!song) {
      return res.status(404).json({ message: "Khong tim thay" });
    }
    res.status(200).json({ message: "da tim thay bai hat", data: song });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

//PUT

const updateSong = async (req, res) => {
  try {
    const songId = req.params.id;
    const updatedSong = await Song.findByIdAndUpdate(songId, req.body, {
      new: true,
    });
    if (!updateSong) {
      return res.status(404).json({ message: "Khong tim thay bai hat" });
    }
    res.status(200).json({ message: "Da cap nhat", data: updatedSong });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

//delete

const deleteSong = async (req, res) => {
  try {
    const songId = req.params.id;
    const deletedSong = await Song.findByIdAndDelete(songId);
    if (!deletedSong) {
      return res.status(404).json({ message: "Khong tim thay bai hat" });
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
