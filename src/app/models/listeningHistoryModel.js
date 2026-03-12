const mongoose = require("mongoose");

const listeningHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // Đánh index giúp truy vấn lịch sử của 1 người cực kỳ nhanh
  },

  // 2. Nghe bài hát nào? (Móc sang bảng Song)
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true,
  },

  // 3. Nghe lúc nào?
  listenedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ListeningHistory", listeningHistorySchema);
