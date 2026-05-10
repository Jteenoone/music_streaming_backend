const mongoose = require("mongoose");
const Song = require("../models/songModel");
const removeAccents = require("../utils/removeAccent");
const Artist = require("../models/artistModel");
const Album = require("../models/albumModel");
const User = require("../models/userModel");
const Favorite = require("../models/favoriteModel");

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

const getRecommendedService = async (songId, excludeIds = [], userId = null) => {
  const song = await Song.findById(songId);
  if (!song) return { success: false, status: 404, message: "Không tìm thấy bài hát" };

  const excludedIds = [...new Set([songId.toString(), ...excludeIds.map(String)])].map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  // --- Bước 2: Lấy lịch sử user để cá nhân hoá ---
  let userArtistIds = [];
  let userGenres = [];
  if (userId) {
    const user = await User.findById(userId).select("recentlyPlayed followedArtists");
    if (user) {
      // Nghệ sỹ user follow
      userArtistIds = user.followedArtists.map((a) => a.toString());

      // Lấy genre + artist từ 20 bài nghe gần nhất
      const recentSongIds = user.recentlyPlayed.slice(0, 20).map((r) => r.song);
      if (recentSongIds.length) {
        const recentSongs = await Song.find({ _id: { $in: recentSongIds } }).select("artist genre");
        recentSongs.forEach((s) => {
          if (s.artist) userArtistIds.push(s.artist.toString());
          s.genre.forEach((g) => userGenres.push(g));
        });
      }

      // Lấy genre + artist từ bài hát đã thích
      const liked = await Favorite.find({ userId }).populate("songId", "artist genre");
      liked.forEach((f) => {
        if (f.songId) {
          if (f.songId.artist) userArtistIds.push(f.songId.artist.toString());
          f.songId.genre.forEach((g) => userGenres.push(g));
        }
      });
    }
  }

  const artistObjIds = [...new Set(userArtistIds)]
    .map((id) => { try { return new mongoose.Types.ObjectId(id); } catch { return null; } })
    .filter(Boolean);

  // Tần suất genre để tăng trọng số
  const genreFreq = {};
  userGenres.forEach((g) => { genreFreq[g] = (genreFreq[g] || 0) + 1; });
  const topGenres = Object.keys(genreFreq).sort((a, b) => genreFreq[b] - genreFreq[a]).slice(0, 10);

  const PREFERENCE_COUNT = userId ? 7 : 10;
  const TRENDING_COUNT   = userId ? 3 : 0;

  // --- Bước 1: Aggregation với scoring ---
  const scoreComponents = [
    // Cùng nghệ sỹ với bài đang nghe: +5
    { $cond: [{ $eq: ["$artist", song.artist] }, 5, 0] },
    // Số genre trùng với bài đang nghe: +3 mỗi genre
    {
      $multiply: [
        { $size: { $ifNull: [{ $setIntersection: ["$genre", song.genre] }, []] } },
        3,
      ],
    },
    // Play count weight (bình thường hoá, tối đa +5)
    { $min: [{ $divide: [{ $ifNull: ["$playCount", 0] }, 2000] }, 5] },
  ];

  if (artistObjIds.length) {
    // Nghệ sỹ user hay nghe: +2
    scoreComponents.push({ $cond: [{ $in: ["$artist", artistObjIds] }, 2, 0] });
  }
  if (topGenres.length) {
    // Genre user hay nghe: +1 mỗi genre trùng
    scoreComponents.push({
      $multiply: [
        { $size: { $ifNull: [{ $setIntersection: ["$genre", topGenres] }, []] } },
        1,
      ],
    });
  }

  const preferenceResults = await Song.aggregate([
    {
      $match: {
        "copyright.status": { $nin: ["expired", "disputed"] },
        $or: [
          { "copyright.expiresAt": { $exists: false } },
          { "copyright.expiresAt": null },
          { "copyright.expiresAt": { $gt: new Date() } },
        ],
        _id: { $nin: excludedIds },
      },
    },
    { $addFields: { score: { $add: scoreComponents } } },
    { $sort: { score: -1 } },
    { $limit: PREFERENCE_COUNT },
    {
      $lookup: {
        from: "artists",
        localField: "artist",
        foreignField: "_id",
        as: "artist",
        pipeline: [{ $project: { name: 1, imageUrl: 1 } }],
      },
    },
    { $unwind: { path: "$artist", preserveNullAndEmpty: true } },
  ]);

  if (!userId || TRENDING_COUNT === 0) {
    return { success: true, data: preferenceResults };
  }

  // --- Bước 3: Mix 30% trending ---
  const preferenceObjIds = preferenceResults.map((s) => s._id);
  const trendingResults = await Song.find({
    ...availableFilter,
    _id: { $nin: [...excludedIds, ...preferenceObjIds] },
  })
    .sort({ playCount: -1 })
    .limit(TRENDING_COUNT)
    .populate("artist", "name imageUrl");

  return { success: true, data: [...preferenceResults, ...trendingResults] };
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
