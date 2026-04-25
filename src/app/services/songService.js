const Song = require("../models/songModel");
const removeAccents = require("../utils/removeAccent");
const Artist = require("../models/artistModel");
const Album = require("../models/albumModel");

// Bài hát hiển thị được: status không phải expired/disputed VÀ chưa hết hạn
const availableFilter = {
  "copyright.status": { $nin: ["expired", "disputed"] },
  $or: [
    { "copyright.expiresAt": { $exists: false } },
    { "copyright.expiresAt": null },
    { "copyright.expiresAt": { $gt: new Date() } },
  ],
};

const createSongService = async (data) => {
  const newSong = new Song(data);
  await newSong.save();
  return { success: true, data: newSong };
};

const getAllSongsService = async (page = 1, limit = 10, showAll = false) => {
  const skip = (page - 1) * limit;
  const filter = showAll ? {} : availableFilter;

  const songs = await Song.find(filter)
    .populate("artist", "name imageUrl")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalSongs = await Song.countDocuments(filter);
  const totalPages = Math.ceil(totalSongs / limit);

  return {
    success: true,
    data: {
      songs,
      pagination: { currentPage: page, totalPages, totalSongs, limit },
    },
  };
};

const getSongByIdService = async (songId, showAll = false) => {
  const song = await Song.findById(songId).populate("artist", "name");
  if (!song) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  if (!showAll) {
    const s = song.copyright?.status;
    const exp = song.copyright?.expiresAt;
    const blocked =
      s === "expired" ||
      s === "disputed" ||
      (exp && new Date(exp) <= new Date());
    if (blocked) {
      return { success: false, status: 403, message: "Bài hát này hiện không khả dụng do vấn đề bản quyền." };
    }
  }
  return { success: true, data: song };
};

const updateSongService = async (songId, data) => {
  const song = await Song.findById(songId);
  if (!song) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  // Xử lý riêng object copyright để không ghi đè toàn bộ
  if (data.copyright && typeof data.copyright === "object") {
    Object.assign(song.copyright, data.copyright);
    delete data.copyright;
  }
  Object.assign(song, data);
  await song.save();
  return { success: true, data: song };
};

const deleteSongService = async (songId) => {
  const deletedSong = await Song.findByIdAndDelete(songId);
  if (!deletedSong) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  return { success: true, data: deletedSong };
};

const incrementPlayCountService = async (songId) => {
  const updatedSong = await Song.findByIdAndUpdate(
    songId,
    { $inc: { playCount: 1 } },
    { new: true },
  );
  if (!updatedSong) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }
  return { success: true, data: updatedSong };
};

const getTrendingSongService = async () => {
  const trendingSongs = await Song.find(availableFilter)
    .sort({ playCount: -1 })
    .limit(10)
    .populate("artist", "name imageUrl");
  return { success: true, data: trendingSongs };
};

const searchService = async (keyword) => {
  const keywordNoAccent = removeAccents(keyword);
  const regex = new RegExp(keywordNoAccent, "i");
  const rawRegex = new RegExp(keyword, "i");

  const [songs, artists, albums] = await Promise.all([
    Song.find({ ...availableFilter, titleNoAccent: regex })
      .populate("artist", "name imageUrl")
      .limit(8),
    Artist.find({ nameNoAccent: regex }).limit(4),
    Album.find({ title: { $regex: rawRegex } }).populate("artist", "name").limit(4),
  ]);

  return { success: true, data: { songs, artists, albums } };
};

const getRecommendedService = async (songId, excludeIds = []) => {
  const song = await Song.findById(songId);
  if (!song) return { success: false, status: 404, message: "Không tìm thấy bài hát" };

  const excluded = [...new Set([songId.toString(), ...excludeIds.map(String)])];

  const recommended = await Song.find({
    ...availableFilter,
    _id: { $nin: excluded },
    $or: [
      { artist: song.artist },
      { genre: { $in: song.genre } },
    ],
  })
    .populate("artist", "name imageUrl")
    .sort({ playCount: -1 })
    .limit(10);

  return { success: true, data: recommended };
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
  getRecommendedService,
};
