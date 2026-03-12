const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // 2. Album này của Ca sĩ nào?
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },

    // 3. Ảnh bìa của Album
    coverImage: {
      type: String,
      default: "",
    },

    // 4. Danh sách các bài hát nằm trong Album này
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],

    // 5. Năm phát hành
    releaseYear: {
      type: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Album", albumSchema);
