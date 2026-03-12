const mongoose = require("mongoose");

const playlistSongSchema = new mongoose.Schema({
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Playlist",
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Song",
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

playlistSongSchema.index({ playlistId: 1, songId: 1 }, { unique: true });

module.exports = mongoose.model("PlaylistSong", playlistSongSchema);
