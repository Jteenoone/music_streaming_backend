const mongoose = require("mongoose");
const removeAccents = require("../utils/removeAccent");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleNoAccent: {
      type: String,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    album: { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
    coverImage: {
      type: String,
      default: "",
    },
    audioUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    genre: {
      type: [String],
      required: true,
      index: true,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    isrc: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    iswc: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    copyright: {
      owner:     { type: String, default: "" },
      license:   { type: String, default: "All rights reserved" },
      year:      { type: Number },
      status:    { type: String, enum: ["active", "expired", "disputed"], default: "active" },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true },
);

songSchema.pre("save", function () {
  if (this.isModified("title") && this.title) {
    this.titleNoAccent = removeAccents(this.title);
  }
});

module.exports = mongoose.model("Song", songSchema);
