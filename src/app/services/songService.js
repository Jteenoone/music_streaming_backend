const Song = require("../models/songModel");
const removeAccents = require("../utils/removeAccent");
const Artist = require("../models/artistModel");

const createSongService = async (data) => {
  const newSong = new Song(data);
  await newSong.save();
  return { success: true, data: newSong };
};

const getAllSongsService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const songs = await Song.find()
    .populate("artist", "name imageUrl")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalSongs = await Song.countDocuments();
  const totalPages = Math.ceil(totalSongs / limit);

  return {
    success: true,
    data: {
      songs: songs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalSongs: totalSongs,
        limit: limit,
      },
    },
  };
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

//tăng lượt nghe
const incrementPlayCountService = async (songId) => {
  const updatedSong = await Song.findByIdAndUpdate(
    songId,
    { $inc: { playCount: 1 } },
    { new: true },
  );
  if (!updatedSong) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  return { success: true, data: updatedSong };
};

//bảng xếp hạng trending
const getTrendingSongService = async () => {
  const trendingSongs = await Song.find()
    .sort({ playCount: -1 })
    .limit(10)
    .populate("artist", "name imageUrl");
  return { success: true, data: trendingSongs };
};

//tìm kiếm
const searchService = async (keyword) => {
  const keywordNoAccent = removeAccents(keyword);
  const regex = new RegExp(keywordNoAccent, "i");

  const songs = await Song.find({ titleNoAccent: regex })
    .populate("artist", "name imageUrl")
    .limit(15);

  const artists = await Artist.find({ nameNoAccent: regex }).limit(5);

  return {
    success: true,
    data: { songs, artists },
  };
};

module.exports = {
  createSongService,
  getAllSongsService,
  getSongByIdService,
  updateSongService,
  deleteSongService,
  incrementPlayCountService,
  getTrendingSongService,
  searchService,
};
