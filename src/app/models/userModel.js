const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resetPasswordOTP: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    followedArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }],
    savedAlbums:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Album"  }],
    recentlyPlayed:  [{
      song:     { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
      playedAt: { type: Date, default: Date.now },
    }],
    verifyEmailOTP: {
      type: String,
      default: null,
    },
    verifyEmailExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
