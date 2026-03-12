const Song = require("../models/songModel");

const createSongService = async (data) => {
  const newSong = new Song(data);
  await newSong.save();
  return { success: true, data: newSong };
};

const getAllSongsService = async () => {
  const songs = await Song.find()
    .populate("artist", "name")
    .sort({ createdAt: -1 });
  return { success: true, data: songs };
};

const getSongByIdService = async (songId) => {
  const song = await Song.findById(songId).populate("artist", "name");
  if (!song) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  return { success: true, data: song };
};

const updateSongService = async (songId, data) => {
  const updatedSong = await Song.findByIdAndUpdate(songId, data, { new: true });
  if (!updatedSong) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  return { success: true, data: updatedSong };
};

const deleteSongService = async (songId) => {
  const deletedSong = await Song.findByIdAndDelete(songId);
  if (!deletedSong) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  return { success: true, data: deletedSong };
};

module.exports = {
  createSongService,
  getAllSongsService,
  getSongByIdService,
  updateSongService,
  deleteSongService,
};
