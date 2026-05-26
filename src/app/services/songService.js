const mongoose = require("mongoose");
const Song = require("../models/songModel");
const removeAccents = require("../utils/removeAccent");
const Artist = require("../models/artistModel");
const Album = require("../models/albumModel");
const User = require("../models/userModel");
const Favorite = require("../models/favoriteModel");
const ListeningHistory = require("../models/listeningHistoryModel");

// FIX: dùng function thay vì const để new Date() luôn fresh khi gọi
const getAvailableFilter = () => ({
  "copyright.status": { $nin: ["expired", "disputed"] },
  $or: [
    { "copyright.expiresAt": { $exists: false } },
    { "copyright.expiresAt": null },
    { "copyright.expiresAt": { $gt: new Date() } },
  ],
});

const createSongService = async (data) => {
  const newSong = new Song(data);
  await newSong.save();
  return { success: true, data: newSong };
};

const getAllSongsService = async (page = 1, limit = 10, showAll = false) => {
  const skip = (page - 1) * limit;
  const filter = showAll ? {} : getAvailableFilter();

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

// IMPROVEMENT: Trending theo all-time, tuần, hoặc tháng
const getTrendingSongService = async (period = "all") => {
  if (period === "all") {
    const songs = await Song.find(getAvailableFilter())
      .sort({ playCount: -1 })
      .limit(10)
      .populate("artist", "name imageUrl");
    return { success: true, data: songs };
  }

  const since = new Date();
  if (period === "week")  since.setDate(since.getDate() - 7);
  if (period === "month") since.setMonth(since.getMonth() - 1);

  // Đếm số lần nghe trong khoảng thời gian từ ListeningHistory
  const trending = await ListeningHistory.aggregate([
    { $match: { listenedAt: { $gte: since } } },
    { $group: { _id: "$song", recentPlays: { $sum: 1 } } },
    { $sort: { recentPlays: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "songs",
        localField: "_id",
        foreignField: "_id",
        as: "song",
      },
    },
    { $unwind: "$song" },
    // Lọc bài hát còn khả dụng
    {
      $match: {
        "song.copyright.status": { $nin: ["expired", "disputed"] },
        $or: [
          { "song.copyright.expiresAt": { $exists: false } },
          { "song.copyright.expiresAt": null },
          { "song.copyright.expiresAt": { $gt: new Date() } },
        ],
      },
    },
    { $limit: 10 },
    { $replaceRoot: { newRoot: { $mergeObjects: ["$song", { recentPlays: "$recentPlays" }] } } },
    {
      $lookup: {
        from: "artists",
        localField: "artist",
        foreignField: "_id",
        as: "artist",
        pipeline: [{ $project: { name: 1, imageUrl: 1 } }],
      },
    },
    { $unwind: { path: "$artist", preserveNullAndEmptyArrays: true } },
  ]);

  // Nếu ListeningHistory chưa có đủ data → fallback về all-time
  if (trending.length < 5) {
    const fallback = await Song.find(getAvailableFilter())
      .sort({ playCount: -1 })
      .limit(10)
      .populate("artist", "name imageUrl");
    return { success: true, data: fallback };
  }

  return { success: true, data: trending };
};

const searchService = async (keyword) => {
  const keywordNoAccent = removeAccents(keyword);
  const regex = new RegExp(keywordNoAccent, "i");
  const rawRegex = new RegExp(keyword, "i");

  const [songs, artists, albums] = await Promise.all([
    Song.find({ ...getAvailableFilter(), titleNoAccent: regex })
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

  // ── Xây dựng taste profile với recency decay ─────────────────────────────────
  let artistObjIds = [];
  let topGenres    = [];

  if (userId) {
    // Fetch song song: lịch sử nghe, bài yêu thích, danh sách follow
    const [recentHistory, liked, userDoc] = await Promise.all([
      ListeningHistory.find({ user: userId })
        .sort({ listenedAt: -1 })
        .limit(50)
        .select("song listenedAt"),
      Favorite.find({ userId }).populate("songId", "artist genre"),
      User.findById(userId).select("followedArtists"),
    ]);

    const artistScore = {};
    const genreScore  = {};
    const now         = Date.now();

    // Lịch sử nghe — decay: 7 ngày = ×3, 30 ngày = ×1.5, cũ hơn = ×1
    if (recentHistory.length) {
      const histSongs = await Song.find({
        _id: { $in: recentHistory.map((h) => h.song) },
      }).select("_id artist genre");

      const songMap = {};
      histSongs.forEach((s) => { songMap[s._id.toString()] = s; });

      recentHistory.forEach((h) => {
        const days   = (now - new Date(h.listenedAt).getTime()) / 86_400_000;
        const weight = days < 7 ? 3 : days < 30 ? 1.5 : 1;
        const s      = songMap[h.song.toString()];
        if (!s) return;
        if (s.artist) {
          const id = s.artist.toString();
          artistScore[id] = (artistScore[id] || 0) + weight;
        }
        s.genre.forEach((g) => { genreScore[g] = (genreScore[g] || 0) + weight; });
      });
    }

    // Bài yêu thích — weight cố định ×2 (hành động chủ động của user)
    liked.forEach((f) => {
      if (!f.songId) return;
      if (f.songId.artist) {
        const id = f.songId.artist.toString();
        artistScore[id] = (artistScore[id] || 0) + 2;
      }
      f.songId.genre.forEach((g) => { genreScore[g] = (genreScore[g] || 0) + 2; });
    });

    // Nghệ sĩ đang follow — weight ×3 (sở thích được khai báo rõ)
    if (userDoc) {
      userDoc.followedArtists.forEach((a) => {
        const id = a.toString();
        artistScore[id] = (artistScore[id] || 0) + 3;
      });
    }

    artistObjIds = Object.entries(artistScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => { try { return new mongoose.Types.ObjectId(id); } catch { return null; } })
      .filter(Boolean);

    topGenres = Object.entries(genreScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([g]) => g);
  }

  // ── Xây dựng scoring ─────────────────────────────────────────────────────────
  const PREFERENCE_COUNT = userId ? 7 : 10;
  const TRENDING_COUNT   = userId ? 3 : 0;
  const MAX_PER_ARTIST   = 2; // diversity cap
  const FETCH_COUNT      = PREFERENCE_COUNT * 3; // lấy dư để diversity cap không thiếu

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const scoreComponents = [
    // Cùng artist: +5
    { $cond: [{ $eq: ["$artist", song.artist] }, 5, 0] },
    // Genre overlap với bài đang nghe: +3 mỗi genre trùng
    {
      $multiply: [
        { $size: { $ifNull: [{ $setIntersection: ["$genre", song.genre] }, []] } },
        3,
      ],
    },
    // Popularity — log scale: ln(plays+1)/3, max +5
    // (100K lượt = 3.8 điểm vs 1K lượt = 2.3 điểm — phân biệt rõ, không bị flatten)
    { $min: [{ $divide: [{ $ln: { $add: [{ $ifNull: ["$playCount", 0] }, 1] } }, 3] }, 5] },
    // Novelty boost — bài mới trong 30 ngày: +2 (tránh vòng lặp 0 lượt → không ai nghe)
    { $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, 2, 0] },
  ];

  // Cùng album bonus: +1
  if (song.album) {
    scoreComponents.push({
      $cond: [{ $and: [{ $ne: ["$album", null] }, { $eq: ["$album", song.album] }] }, 1, 0],
    });
  }

  // Taste profile bonus
  if (artistObjIds.length) {
    scoreComponents.push({ $cond: [{ $in: ["$artist", artistObjIds] }, 2, 0] });
  }
  if (topGenres.length) {
    scoreComponents.push({
      $multiply: [
        { $size: { $ifNull: [{ $setIntersection: ["$genre", topGenres] }, []] } },
        1,
      ],
    });
  }

  // ── Aggregation ──────────────────────────────────────────────────────────────
  const rawResults = await Song.aggregate([
    { $match: { ...getAvailableFilter(), _id: { $nin: excludedIds } } },
    { $addFields: { score: { $add: scoreComponents } } },
    { $sort: { score: -1 } },
    { $limit: FETCH_COUNT },
    { $project: { score: 0 } },
    {
      $lookup: {
        from: "artists",
        localField: "artist",
        foreignField: "_id",
        as: "artist",
        pipeline: [{ $project: { name: 1, imageUrl: 1 } }],
      },
    },
    { $unwind: { path: "$artist", preserveNullAndEmptyArrays: true } },
  ]);

  // ── Diversity cap: max MAX_PER_ARTIST bài từ cùng 1 nghệ sĩ ─────────────────
  const artistCount    = {};
  const preferenceResults = [];
  for (const s of rawResults) {
    if (preferenceResults.length >= PREFERENCE_COUNT) break;
    const aId = s.artist?._id?.toString() ?? "unknown";
    if ((artistCount[aId] || 0) < MAX_PER_ARTIST) {
      preferenceResults.push(s);
      artistCount[aId] = (artistCount[aId] || 0) + 1;
    }
  }

  if (!userId || TRENDING_COUNT === 0) {
    return { success: true, data: preferenceResults };
  }

  // ── Mix 30% trending ─────────────────────────────────────────────────────────
  const preferenceObjIds = preferenceResults.map((s) => s._id);
  const trendingResults = await Song.find({
    ...getAvailableFilter(),
    _id: { $nin: [...excludedIds, ...preferenceObjIds] },
  })
    .sort({ playCount: -1 })
    .limit(TRENDING_COUNT)
    .populate("artist", "name imageUrl");

  return { success: true, data: [...preferenceResults, ...trendingResults] };
};

// ── Daily Mix ────────────────────────────────────────────────────────────────
// Trả về 2-3 playlist card: 1 trending hôm nay + 1-2 genre từ sở thích user
const getDailyMixService = async (userId) => {
  const availFilter  = getAvailableFilter();
  const since24h     = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Trending trong 24h — dùng để boost và tạo mix đầu tiên
  const todayAgg = await ListeningHistory.aggregate([
    { $match: { listenedAt: { $gte: since24h } } },
    { $group: { _id: "$song", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 40 },
  ]);
  const todayTrendingIds = new Set(todayAgg.map((t) => t._id.toString()));

  const mixes = [];

  // ── Mix "Trending hôm nay" (luôn có) ─────────────────────────────────────
  let trendSongs;
  if (todayAgg.length >= 5) {
    const ids = todayAgg.slice(0, 20).map((t) => t._id);
    const raw = await Song.find({ ...availFilter, _id: { $in: ids } })
      .populate("artist", "name imageUrl");
    const order = {};
    ids.forEach((id, i) => { order[id.toString()] = i; });
    trendSongs = raw.sort((a, b) => (order[a._id.toString()] ?? 99) - (order[b._id.toString()] ?? 99));
  } else {
    trendSongs = await Song.find(availFilter)
      .sort({ playCount: -1 }).limit(20).populate("artist", "name imageUrl");
  }

  if (trendSongs.length >= 3) {
    mixes.push({
      id:          "trending-today",
      title:       "Trending Hôm Nay",
      description: "Nghe nhiều nhất trong 24 giờ qua",
      gradient:    ["#7c3aed", "#2563eb"],
      songs:       trendSongs,
    });
  }

  // ── Mix dựa trên genre sở thích (chỉ khi đã đăng nhập) ───────────────────
  if (userId) {
    const [recentHistory, liked] = await Promise.all([
      ListeningHistory.find({ user: userId }).sort({ listenedAt: -1 }).limit(50).select("song"),
      Favorite.find({ userId }).select("songId"),
    ]);

    const seedIds = [
      ...recentHistory.map((h) => h.song),
      ...liked.filter((f) => f.songId).map((f) => f.songId),
    ];

    if (seedIds.length > 0) {
      const seedSongs  = await Song.find({ _id: { $in: seedIds } }).select("genre");
      const genreScore = {};
      seedSongs.forEach((s) => s.genre.forEach((g) => { genreScore[g] = (genreScore[g] || 0) + 1; }));
      const topGenres = Object.entries(genreScore)
        .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => g);

      const GENRE_COLORS = {
        Pop:     ["#db2777", "#9333ea"],
        "R&B":   ["#059669", "#0891b2"],
        "Hip-Hop":["#d97706", "#dc2626"],
        Jazz:    ["#1d4ed8", "#7c3aed"],
        Rock:    ["#dc2626", "#92400e"],
        Ballad:  ["#0891b2", "#1d4ed8"],
        EDM:     ["#7c3aed", "#db2777"],
        Classical:["#0f766e", "#1d4ed8"],
      };
      const DEFAULT_COLORS = [["#4f46e5", "#0891b2"], ["#065f46", "#1e40af"]];

      for (let i = 0; i < topGenres.length; i++) {
        const genre = topGenres[i];
        const pool  = await Song.find({ ...availFilter, genre: { $in: [genre] } })
          .populate("artist", "name imageUrl").limit(50);

        // Bài trending hôm nay lên trước, còn lại sort theo playCount
        pool.sort((a, b) => {
          const aT = todayTrendingIds.has(a._id.toString()) ? 1 : 0;
          const bT = todayTrendingIds.has(b._id.toString()) ? 1 : 0;
          if (aT !== bT) return bT - aT;
          return (b.playCount ?? 0) - (a.playCount ?? 0);
        });

        if (pool.length >= 3) {
          mixes.push({
            id:          `mix-${genre.toLowerCase().replace(/\s+/g, "-")}`,
            title:       `Daily Mix ${mixes.length + 1}`,
            description: genre,
            gradient:    GENRE_COLORS[genre] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            songs:       pool.slice(0, 20),
          });
        }
      }
    }
  }

  return { success: true, data: mixes };
};

// ── Royalty Report ───────────────────────────────────────────────────────────
const getRoyaltyReportService = async (period = "month") => {
  let since = null;
  if (period === "today") {
    since = new Date();
    since.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
  }

  const matchStage = since ? { $match: { listenedAt: { $gte: since } } } : { $match: {} };

  const rows = await ListeningHistory.aggregate([
    matchStage,
    { $lookup: { from: "songs", localField: "song", foreignField: "_id", as: "s" } },
    { $unwind: { path: "$s", preserveNullAndEmpty: false } },
    {
      $group: {
        _id: { $ifNull: [{ $trim: { input: "$s.copyright.owner" } }, ""] },
        streams:   { $sum: 1 },
        songIds:   { $addToSet: "$s._id" },
      },
    },
    {
      $project: {
        _id:       0,
        owner:     { $cond: [{ $eq: ["$_id", ""] }, "(Chưa khai báo)", "$_id"] },
        streams:   1,
        songCount: { $size: "$songIds" },
      },
    },
    { $sort: { streams: -1 } },
  ]);

  return { success: true, data: { rows, period } };
};

// ── Stats ────────────────────────────────────────────────────────────────────
const getListensCountService = async (period = "today") => {
  let since = null;
  if (period === "today") {
    since = new Date();
    since.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    since = new Date();
    since.setDate(since.getDate() - 7);
  } else if (period === "month") {
    since = new Date();
    since.setMonth(since.getMonth() - 1);
  }

  const filter = since ? { listenedAt: { $gte: since } } : {};
  const count = await ListeningHistory.countDocuments(filter);
  return { success: true, data: { count, period } };
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
  getDailyMixService,
  getListensCountService,
  getRoyaltyReportService,
};
