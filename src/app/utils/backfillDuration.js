// Script một lần: điền duration cho các bài hát đang lưu 0 giây.
// Đọc duration thật từ metadata Cloudinary rồi cập nhật DB.
// Chạy: node src/app/utils/backfillDuration.js
require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Song = require("../models/songModel");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Lấy public_id từ URL Cloudinary: bỏ phần tới /upload/vXXXX/ và đuôi mở rộng
const publicIdFromUrl = (url) =>
  url.split("/upload/")[1]?.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const songs = await Song.find({
    $or: [{ duration: 0 }, { duration: null }, { duration: { $exists: false } }],
  }).select("title audioUrl");

  console.log(`Tìm thấy ${songs.length} bài cần backfill duration.\n`);

  let ok = 0, fail = 0;
  for (const song of songs) {
    const pid = song.audioUrl && publicIdFromUrl(song.audioUrl);
    if (!pid) {
      console.log(`  ✗ ${song.title} — không đọc được public_id từ audioUrl`);
      fail++;
      continue;
    }
    try {
      const res = await cloudinary.api.resource(pid, { resource_type: "video", media_metadata: true });
      const duration = Math.round(res.duration || 0);
      if (duration > 0) {
        await Song.updateOne({ _id: song._id }, { $set: { duration } });
        console.log(`  ✓ ${song.title} → ${duration}s`);
        ok++;
      } else {
        console.log(`  ✗ ${song.title} — Cloudinary không trả duration`);
        fail++;
      }
    } catch (e) {
      console.log(`  ✗ ${song.title} — ${e.message || e}`);
      fail++;
    }
  }

  console.log(`\nXong: ${ok} cập nhật, ${fail} lỗi.`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
