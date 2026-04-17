/**
 * Seed script: tạo dữ liệu mẫu (admin, artists, songs, albums)
 * Chạy: npm run seed
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User   = require("../models/userModel");
const Artist = require("../models/artistModel");
const Song   = require("../models/songModel");
const Album  = require("../models/albumModel");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✓ Kết nối MongoDB thành công\n");

  // ── 1. Admin ────────────────────────────────────────────────────────────────
  const adminEmail = "admin@soundwave.vn";
  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    const hashed = await bcrypt.hash("Admin@123", 10);
    adminUser = await User.create({
      username: "admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
      isVerified: true,
    });
    console.log("✓ Tạo admin");
  } else {
    console.log("  Admin đã tồn tại");
  }
  console.log("  Email   :", adminEmail);
  console.log("  Password: Admin@123\n");

  // ── 2. Artists ──────────────────────────────────────────────────────────────
  const artistData = [
    {
      name: "Jack",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/640px-Camponotus_flavomarginatus_ant.jpg",
    },
    {
      name: "Sơn Tùng M-TP",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/640px-Camponotus_flavomarginatus_ant.jpg",
    },
    {
      name: "HIEUTHUHAI",
      imageUrl: "",
    },
    {
      name: "tlinh",
      imageUrl: "",
    },
  ];

  const artistMap = {}; // name → _id
  for (const a of artistData) {
    let artist = await Artist.findOne({ name: a.name });
    if (!artist) {
      artist = await Artist.create(a);
      console.log(`✓ Artist "${a.name}" _id: ${artist._id}`);
    } else {
      console.log(`  Artist "${a.name}" đã tồn tại _id: ${artist._id}`);
    }
    artistMap[a.name] = artist._id;
  }
  console.log();

  // ── 3. Songs ────────────────────────────────────────────────────────────────
  // Dùng file audio mẫu công khai (mp3 ngắn)
  const SAMPLE_AUDIO = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  const SAMPLE_IMG   = "https://via.placeholder.com/300x300/1a1f35/7c83f5?text=Song";

  const songData = [
    {
      title: "Đom Đóm",
      artist: artistMap["Jack"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 311,
      genre: ["V-Pop"],
      playCount: 5200000,
    },
    {
      title: "Hoa Hải Đường",
      artist: artistMap["Jack"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 260,
      genre: ["V-Pop"],
      playCount: 3100000,
    },
    {
      title: "Thiên Lý Ơi",
      artist: artistMap["Jack"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 285,
      genre: ["V-Pop"],
      playCount: 4800000,
    },
    {
      title: "Chạy Ngay Đi",
      artist: artistMap["Sơn Tùng M-TP"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 245,
      genre: ["V-Pop"],
      playCount: 9000000,
    },
    {
      title: "Lạc Trôi",
      artist: artistMap["Sơn Tùng M-TP"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 268,
      genre: ["V-Pop"],
      playCount: 8200000,
    },
    {
      title: "Muộn Rồi Mà Sao Còn",
      artist: artistMap["Sơn Tùng M-TP"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 248,
      genre: ["V-Pop"],
      playCount: 7500000,
    },
    {
      title: "Không Thể Say",
      artist: artistMap["HIEUTHUHAI"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 198,
      genre: ["Rap", "V-Pop"],
      playCount: 2100000,
    },
    {
      title: "Nước Ngoài",
      artist: artistMap["tlinh"],
      audioUrl: SAMPLE_AUDIO,
      coverImage: SAMPLE_IMG,
      duration: 215,
      genre: ["Rap"],
      playCount: 1800000,
    },
  ];

  const createdSongs = [];
  for (const s of songData) {
    let song = await Song.findOne({ title: s.title, artist: s.artist });
    if (!song) {
      song = await Song.create(s);
      console.log(`✓ Song "${s.title}"`);
    } else {
      console.log(`  Song "${s.title}" đã tồn tại`);
    }
    createdSongs.push(song);
  }
  console.log();

  // ── 4. Albums ───────────────────────────────────────────────────────────────
  const albumData = [
    {
      title: "Đóm",
      artist: artistMap["Jack"],
      coverImage: SAMPLE_IMG,
      releaseYear: 2021,
      songTitles: ["Đom Đóm", "Hoa Hải Đường", "Thiên Lý Ơi"],
    },
    {
      title: "Sky Tour",
      artist: artistMap["Sơn Tùng M-TP"],
      coverImage: SAMPLE_IMG,
      releaseYear: 2022,
      songTitles: ["Chạy Ngay Đi", "Lạc Trôi", "Muộn Rồi Mà Sao Còn"],
    },
  ];

  for (const a of albumData) {
    let album = await Album.findOne({ title: a.title, artist: a.artist });
    const songIds = createdSongs
      .filter(s => a.songTitles.includes(s.title))
      .map(s => s._id);

    if (!album) {
      album = await Album.create({
        title: a.title,
        artist: a.artist,
        coverImage: a.coverImage,
        releaseYear: a.releaseYear,
        songs: songIds,
      });
      console.log(`✓ Album "${a.title}" (${songIds.length} bài)`);
    } else {
      console.log(`  Album "${a.title}" đã tồn tại`);
    }
  }

  console.log("\n✅ Seed hoàn tất!");
  console.log("   → Đăng nhập admin: admin@soundwave.vn / Admin@123");
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("❌ Seed lỗi:", err.message);
  process.exit(1);
});
